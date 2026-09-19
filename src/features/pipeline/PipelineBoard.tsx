import { useState } from 'react'
import type { DragEvent } from 'react'
import type { Prospect, Stage } from '../../types'
import { ACTIVE_STAGES, OFF_TRACK_STAGES, SOURCE_LABELS, STAGE_SHORT_LABELS } from '../../types'
import { BORDER, CARD, FG, MUTED, MUTED_BG } from '../../ui/theme'
import { daysSince, daysUntil, fmtMoney } from '../../lib/dates'
import { STAGE_COLOR } from './stageColors'

type Props = {
  prospects: Prospect[]
  onOpen: (prospect: Prospect) => void
  onChangeStage: (prospectId: string, stage: Stage) => void
  onAddProspect: () => void
}

/** A compact opportunity card — the glanceable state; click opens the full record. */
function BoardCard({
  prospect,
  onOpen,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  prospect: Prospect
  onOpen: () => void
  dragging: boolean
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
}) {
  const total = prospect.assets.reduce((s, a) => s + (a.amount ?? 0), 0)
  const overdue = (daysUntil(prospect.nextStepOn) ?? 1) < 0
  const inStage = daysSince(prospect.stageChangedAt)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${STAGE_COLOR[prospect.stage]}`,
        borderRadius: 7,
        padding: '9px 10px',
        marginBottom: 8,
        cursor: 'grab',
        opacity: dragging ? 0.4 : 1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: FG, lineHeight: 1.3 }}>{prospect.name || 'Untitled'}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: FG, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {fmtMoney(total)}
        </div>
      </div>

      <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{SOURCE_LABELS[prospect.source]}</div>

      {prospect.nextStep && (
        <div
          style={{
            fontSize: 12,
            color: overdue ? '#b91c1c' : MUTED,
            fontWeight: overdue ? 600 : 400,
            marginTop: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={prospect.nextStep}
        >
          {overdue ? '⚠ ' : '→ '}
          {prospect.nextStep}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: '#a1a1aa' }}>
          {inStage === 0 ? 'New today' : `${inStage}d in stage`}
        </span>
        {prospect.activity.length > 0 && (
          <span style={{ fontSize: 10, color: '#a1a1aa' }}>{prospect.activity.length} logged</span>
        )}
      </div>
    </div>
  )
}

export function PipelineBoard({ prospects, onOpen, onChangeStage, onAddProspect }: Props) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<Stage | null>(null)
  const [showOffTrack, setShowOffTrack] = useState(false)

  const byStage = (stage: Stage) => prospects.filter((p) => p.stage === stage)
  const offTrack = prospects.filter((p) => OFF_TRACK_STAGES.includes(p.stage as never))

  const dragHandlers = (p: Prospect) => ({
    dragging: dragId === p.id,
    onDragStart: (e: DragEvent) => {
      setDragId(p.id)
      e.dataTransfer.effectAllowed = 'move'
    },
    onDragEnd: () => setDragId(null),
  })

  const COLUMN_WIDTH = 165

  function renderColumn(stage: Stage) {
    const items = byStage(stage)
    const total = items.reduce((s, p) => s + p.assets.reduce((t, a) => t + (a.amount ?? 0), 0), 0)
    const isDropTarget = overStage === stage && dragId !== null

    return (
      <div
        key={stage}
        onDragOver={(e) => {
          e.preventDefault()
          if (overStage !== stage) setOverStage(stage)
        }}
        onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
        onDrop={(e) => {
          e.preventDefault()
          setOverStage(null)
          if (dragId) onChangeStage(dragId, stage)
          setDragId(null)
        }}
        style={{
          flex: `0 0 ${COLUMN_WIDTH}px`,
          width: COLUMN_WIDTH,
          background: isDropTarget ? MUTED_BG : 'transparent',
          borderRadius: 8,
          transition: 'background 0.1s',
        }}
      >
        <div
          style={{
            borderTop: `3px solid ${STAGE_COLOR[stage]}`,
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderTopWidth: 3,
            borderRadius: 7,
            padding: '8px 10px',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: FG }}>{STAGE_SHORT_LABELS[stage]}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: MUTED, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {items.length} · {total > 0 ? fmtMoney(total) : '—'}
          </div>
        </div>

        <div style={{ minHeight: 40 }}>
          {items.map((p) => (
            <BoardCard key={p.id} prospect={p} onOpen={() => onOpen(p)} {...dragHandlers(p)} />
          ))}
        </div>

        {stage === ACTIVE_STAGES[0] && (
          <button className="b-add" style={{ borderRadius: 6, border: `1px dashed ${BORDER}`, fontSize: 12 }} onClick={onAddProspect}>
            + Add opportunity
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
        {ACTIVE_STAGES.map(renderColumn)}
      </div>

      {offTrack.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => setShowOffTrack((s) => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: MUTED, fontWeight: 600, padding: 0 }}
          >
            {showOffTrack ? '▾' : '▸'} {offTrack.length} stalled or lost
          </button>
          {showOffTrack && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                // Off-track has no single stage to drop into — dropping here
                // just cancels the drag rather than guessing where it goes.
                setDragId(null)
              }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}
            >
              {offTrack.map((p) => (
                <div key={p.id} style={{ width: 240 }}>
                  <BoardCard prospect={p} onOpen={() => onOpen(p)} {...dragHandlers(p)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
