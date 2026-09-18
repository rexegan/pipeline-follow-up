import { useEffect, useState } from 'react'
import type { Asset, FollowUp, Horizon, Prospect, Stage } from './types'
import { STAGE_LABELS } from './types'
import { BG, BORDER, DANGER, FG, MUTED, MUTED_BG, SANS, SIDEBAR, SUCCESS, WARN, styles } from './ui/theme'
import { ActionBtn, Chip, SideLabel, StatCard } from './ui/primitives'
import { localRepository } from './lib/repository'
import { seedFollowUps, seedProspects } from './lib/seedData'
import { blankAsset, blankProspect } from './features/pipeline/blanks'
import { PipelineBoard } from './features/pipeline/PipelineBoard'
import { ProspectDetail } from './features/pipeline/ProspectDetail'
import { suggestFollowUpFor } from './features/pipeline/stageWorkflow'
import { FollowUpTable } from './features/followup/FollowUpTable'
import { daysUntil, fmtDate, fmtMoney, uid } from './lib/dates'
import { defaultDue } from './features/followup/horizons'

const VIEWS = [
  { id: 'pipeline', label: 'Pipeline', icon: '💼', color: '#1d4ed8', bg: '#eff6ff' },
  { id: 'followup', label: 'Follow-Up', icon: '📋', color: '#15803d', bg: '#f0fdf4' },
] as const

type ViewId = (typeof VIEWS)[number]['id']

type PendingSuggestion = { prospectId: string; prospectName: string; title: string; dueOn: string; reason: string }

export default function App() {
  const [view, setView] = useState<ViewId>('pipeline')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<PendingSuggestion | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      let [p, f] = await Promise.all([localRepository.loadProspects(), localRepository.loadFollowUps()])
      // First time this browser has ever opened the app: seed a demo
      // household so the page shows something instead of an empty state.
      // Gated on hasSeeded, not just an empty list, so deleting everything
      // later doesn't bring the demo back.
      if (p.length === 0 && f.length === 0 && !(await localRepository.hasSeeded())) {
        p = seedProspects()
        f = seedFollowUps(p[0].id)
        await Promise.all([localRepository.saveProspects(p), localRepository.saveFollowUps(f)])
        await localRepository.markSeeded()
      }
      if (cancelled) return
      setProspects(p)
      setFollowUps(f)
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Write through on change, but never before the initial load has landed —
  // that would persist the empty starting state over real data.
  useEffect(() => {
    if (loaded) void localRepository.saveProspects(prospects)
  }, [prospects, loaded])

  useEffect(() => {
    if (loaded) void localRepository.saveFollowUps(followUps)
  }, [followUps, loaded])

  const patchProspect = (id: string, patch: Partial<Prospect>) =>
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
    )

  // Routed through separately from patchProspect (rather than just another
  // field) because a stage change is the one edit that means something on
  // its own — it's what Redtail/Wealthbox trigger a task off, and it's what
  // "days in stage" measures from.
  function changeStage(prospectId: string, stage: Stage) {
    const prospect = prospects.find((p) => p.id === prospectId)
    if (!prospect || prospect.stage === stage) return
    const now = new Date().toISOString()
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, stage, stageChangedAt: now, updatedAt: now } : p)),
    )
    const suggested = suggestFollowUpFor(stage)
    setSuggestion(
      suggested
        ? {
            prospectId,
            prospectName: prospect.name || 'this opportunity',
            reason: `Moved to ${STAGE_LABELS[stage]}`,
            ...suggested,
          }
        : null,
    )
  }

  function acceptSuggestion() {
    if (!suggestion) return
    setFollowUps((prev) => [
      ...prev,
      {
        id: uid(),
        title: suggestion.title,
        horizon: 'week',
        prospectId: suggestion.prospectId,
        owner: '',
        reason: suggestion.reason,
        dueOn: suggestion.dueOn,
        done: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      },
    ])
    setSuggestion(null)
  }

  const patchAsset = (prospectId: string, assetId: string, patch: Partial<Asset>) =>
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, assets: p.assets.map((a) => (a.id === assetId ? { ...a, ...patch } : a)), updatedAt: new Date().toISOString() }
          : p,
      ),
    )

  const addAsset = (prospectId: string, patch: Partial<Asset> = {}) =>
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, assets: [...p.assets, { ...blankAsset(), ...patch }] } : p)),
    )

  const deleteAsset = (prospectId: string, assetId: string) =>
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, assets: p.assets.filter((a) => a.id !== assetId) } : p)),
    )

  function addProspect() {
    const p = blankProspect()
    setProspects((prev) => [...prev, p])
    setSelectedId(p.id)
  }

  function deleteProspect(id: string) {
    setProspects((prev) => prev.filter((p) => p.id !== id))
    setSelectedId((sel) => (sel === id ? null : sel))
    setSuggestion((s) => (s?.prospectId === id ? null : s))
  }

  const addFollowUp = (horizon: Horizon) =>
    setFollowUps((prev) => [
      ...prev,
      {
        id: uid(),
        title: '',
        horizon,
        prospectId: null,
        owner: '',
        reason: '',
        dueOn: defaultDue(horizon),
        done: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      },
    ])

  const openProspects = prospects.filter((p) => p.stage !== 'lost' && p.stage !== 'stalled')
  const inPlay = openProspects.reduce((s, p) => s + p.assets.reduce((t, a) => t + (a.amount ?? 0), 0), 0)
  const moving = openProspects
    .flatMap((p) => p.assets)
    .filter((a) => a.status === 'paperwork' || a.status === 'in-transit')
    .reduce((s, a) => s + (a.amount ?? 0), 0)
  const funded = prospects
    .filter((p) => p.stage === 'funded')
    .reduce((s, p) => s + p.assets.reduce((t, a) => t + (a.amount ?? 0), 0), 0)

  const openFollowUps = followUps.filter((f) => !f.done)
  const dueToday = openFollowUps.filter((f) => f.horizon === 'today' || (daysUntil(f.dueOn) ?? 1) <= 0).length
  const overdueCount = openFollowUps.filter((f) => (daysUntil(f.dueOn) ?? 1) < 0).length

  const heading = view === 'pipeline' ? 'Pipeline' : 'Follow-Up'
  const blurb = view === 'pipeline' ? 'Opportunities' : 'Today, this week, this month'
  const stamp = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const selected = prospects.find((p) => p.id === selectedId) ?? null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: SANS, color: FG }}>
      <style>{styles}</style>

      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: SIDEBAR,
          borderRight: `1px solid ${BORDER}`,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          padding: '16px 12px',
        }}
      >
        <div style={{ padding: '4px 4px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: FG, letterSpacing: '-0.01em' }}>Russell Wealth Group</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>Pipeline &amp; Follow-Up</div>
        </div>

        <SideLabel>Views</SideLabel>
        {VIEWS.map((v) => (
          <button key={v.id} className="side-btn" aria-current={view === v.id} onClick={() => setView(v.id)}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                background: v.bg,
                color: v.color,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              {v.icon}
            </span>
            <span>{v.label}</span>
          </button>
        ))}

        <div style={{ margin: '14px 0', borderTop: `1px solid ${BORDER}` }} />

        <SideLabel>Summary</SideLabel>
        {view === 'pipeline' ? (
          <>
            <StatCard label="Total OPPS" value={fmtMoney(inPlay)} color={FG} />
            <StatCard label="In Process" value={fmtMoney(moving)} color={WARN} />
            <StatCard label="Completed" value={fmtMoney(funded)} color={SUCCESS} />
            <StatCard label="Open Opportunities" value={openProspects.length} />
            <button className="btn-primary" onClick={addProspect}>
              + New Opportunity
            </button>
          </>
        ) : (
          <>
            <StatCard label="Due Today" value={dueToday} color={dueToday > 0 ? WARN : FG} />
            <StatCard label="Overdue" value={overdueCount} color={overdueCount > 0 ? DANGER : FG} />
            <StatCard label="Open" value={openFollowUps.length} />
            <StatCard label="Done" value={followUps.length - openFollowUps.length} color={SUCCESS} />
            <button className="btn-primary" onClick={() => addFollowUp('today')}>
              + New Follow-Up
            </button>
          </>
        )}
      </aside>

      <div style={{ flex: 1, minWidth: 0, background: BG }}>
        <div style={{ padding: '28px 28px 48px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: FG }}>
                {heading}
              </h1>
              <Chip label={blurb} color={MUTED} bg={MUTED_BG} border />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>Russell Wealth Group &mdash; {stamp}</p>
          </div>

          {view === 'pipeline' && suggestion && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <span style={{ flex: 1 }}>
                <strong>{suggestion.prospectName}</strong> moved stage — add "{suggestion.title}" as a follow-up due{' '}
                {fmtDate(suggestion.dueOn)}?
              </span>
              <ActionBtn label="Add follow-up" onClick={acceptSuggestion} small />
              <ActionBtn label="Skip" color={MUTED} onClick={() => setSuggestion(null)} small />
            </div>
          )}

          {view === 'pipeline' ? (
            <PipelineBoard
              prospects={prospects}
              onOpen={(p) => setSelectedId(p.id)}
              onChangeStage={changeStage}
              onAddProspect={addProspect}
            />
          ) : (
            <FollowUpTable
              followUps={followUps}
              prospects={prospects}
              onChange={(id, patch) => setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))}
              onDelete={(id) => setFollowUps((prev) => prev.filter((f) => f.id !== id))}
              onAdd={addFollowUp}
            />
          )}
        </div>
      </div>

      {selected && (
        <ProspectDetail
          prospect={selected}
          onChange={(patch) => patchProspect(selected.id, patch)}
          onChangeStage={(stage) => changeStage(selected.id, stage)}
          onAssetChange={(assetId, patch) => patchAsset(selected.id, assetId, patch)}
          onAddAsset={() => addAsset(selected.id)}
          onDeleteAsset={(assetId) => deleteAsset(selected.id, assetId)}
          onDelete={() => deleteProspect(selected.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
