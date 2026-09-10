import { useMemo, useState } from 'react'
import type { Prospect, Source, Stage } from '../../types'
import { ACTIVE_STAGES, SOURCES, SOURCE_LABELS, STAGES, STAGE_LABELS } from '../../types'
import { C } from '../../ui/theme'
import { ActionBtn, Empty, StatTile } from '../../ui/primitives'
import { fmtMoney } from '../../lib/dates'
import { ProspectCard } from './ProspectCard'
import { ProspectForm } from './ProspectForm'
import { blankProspect } from './blanks'
import { STAGE_COLORS } from './stageColors'

type Props = {
  prospects: Prospect[]
  onSave: (prospect: Prospect) => void
  onChange: (id: string, patch: Partial<Prospect>) => void
  onDelete: (id: string) => void
  onAddFollowUp: (prospect: Prospect) => void
}

const OFF_TRACK: Stage[] = ['stalled', 'lost']

export function PipelineSection({ prospects, onSave, onChange, onDelete, onAddFollowUp }: Props) {
  const [editing, setEditing] = useState<Prospect | null>(null)
  const [stageFilter, setStageFilter] = useState<Stage | 'active' | 'all'>('active')
  const [sourceFilter, setSourceFilter] = useState<Source | 'all'>('all')

  const visible = useMemo(() => {
    return prospects
      .filter((p) => {
        if (stageFilter === 'all') return true
        if (stageFilter === 'active') return !OFF_TRACK.includes(p.stage)
        return p.stage === stageFilter
      })
      .filter((p) => (sourceFilter === 'all' ? true : p.source === sourceFilter))
      .sort((a, b) => ACTIVE_STAGES.indexOf(a.stage as never) - ACTIVE_STAGES.indexOf(b.stage as never))
  }, [prospects, stageFilter, sourceFilter])

  const active = prospects.filter((p) => !OFF_TRACK.includes(p.stage))
  const inPlay = active.reduce((sum, p) => sum + p.assets.reduce((s, a) => s + (a.amount ?? 0), 0), 0)
  const moving = active
    .flatMap((p) => p.assets)
    .filter((a) => a.status === 'paperwork' || a.status === 'in-transit')
    .reduce((sum, a) => sum + (a.amount ?? 0), 0)
  const ramsey = active.filter((p) => p.source === 'dave-ramsey').length

  const byStage = ACTIVE_STAGES.map((stage) => ({
    stage,
    count: prospects.filter((p) => p.stage === stage).length,
    dollars: prospects
      .filter((p) => p.stage === stage)
      .reduce((sum, p) => sum + p.assets.reduce((s, a) => s + (a.amount ?? 0), 0), 0),
  }))

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 22 }}>
        <StatTile value={active.length} label="Open opportunities" sub="Not stalled or lost" color={C.accent} icon="briefcase" />
        <StatTile value={fmtMoney(inPlay)} label="Assets in play" sub="Identified across open work" color={C.green} icon="dollar" />
        <StatTile value={fmtMoney(moving)} label="Actually moving" sub="Paperwork or in transit" color={C.orange} icon="trendingUp" />
        <StatTile value={ramsey} label="Ramsey referrals" sub="Open, from SmartVestor" color={C.bannerRust} icon="megaphone" />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 18,
          border: `1px solid ${C.border}`,
          background: C.surface,
          overflowX: 'auto',
        }}
      >
        {byStage.map(({ stage, count, dollars }) => (
          <button
            key={stage}
            onClick={() => setStageFilter(stage)}
            title={`Filter to ${STAGE_LABELS[stage]}`}
            style={{
              flex: '1 1 0',
              minWidth: 128,
              padding: '10px 8px',
              border: 'none',
              borderTop: `3px solid ${STAGE_COLORS[stage]}`,
              background: stageFilter === stage ? STAGE_COLORS[stage] + '22' : C.surface,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: STAGE_COLORS[stage] }}>{count}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 2, lineHeight: 1.25 }}>
              {STAGE_LABELS[stage]}
            </div>
            <div style={{ fontSize: 15, color: C.muted, marginTop: 2 }}>{dollars ? fmtMoney(dollars) : '—'}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <ActionBtn label="+ New opportunity" onClick={() => setEditing(blankProspect())} />
        <select
          aria-label="Filter by stage"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as Stage | 'active' | 'all')}
          style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 19, color: C.text }}
        >
          <option value="active">Open stages</option>
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by source"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as Source | 'all')}
          style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 19, color: C.text }}
        >
          <option value="all">Any source</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 18, color: C.muted, marginLeft: 'auto' }}>
          Showing {visible.length} of {prospects.length}
        </span>
      </div>

      {editing && (
        <ProspectForm
          initial={editing}
          onSave={(p) => {
            onSave(p)
            setEditing(null)
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {visible.length === 0 ? (
        <Empty
          label={prospects.length === 0 ? 'No opportunities yet' : 'Nothing matches this filter'}
          sub={
            prospects.length === 0
              ? 'Add the first one — a Ramsey referral, or a client with assets to move.'
              : 'Try a different stage or source.'
          }
        />
      ) : (
        visible.map((p) => (
          <ProspectCard
            key={p.id}
            prospect={p}
            onChange={onChange}
            onEdit={setEditing}
            onDelete={onDelete}
            onAddFollowUp={onAddFollowUp}
          />
        ))
      )}
    </div>
  )
}
