import { useEffect, useState } from 'react'
import type { Asset, FollowUp, Horizon, Prospect } from './types'
import { BG, BORDER, FG, MUTED, MUTED_BG, SANS, SIDEBAR, SUCCESS, WARN, styles } from './ui/theme'
import { Chip, SideLabel, StatCard } from './ui/primitives'
import { localRepository } from './lib/repository'
import { blankAsset, blankProspect } from './features/pipeline/blanks'
import { PipelineTable } from './features/pipeline/PipelineTable'
import { FollowUpTable } from './features/followup/FollowUpTable'
import { daysUntil, fmtMoney, uid } from './lib/dates'
import { defaultDue } from './features/followup/horizons'

const VIEWS = [
  { id: 'pipeline', label: 'Pipeline', icon: '💼', color: '#1d4ed8', bg: '#eff6ff' },
  { id: 'followup', label: 'Follow-Up', icon: '📋', color: '#15803d', bg: '#f0fdf4' },
] as const

type ViewId = (typeof VIEWS)[number]['id']

export default function App() {
  const [view, setView] = useState<ViewId>('pipeline')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([localRepository.loadProspects(), localRepository.loadFollowUps()]).then(([p, f]) => {
      if (cancelled) return
      setProspects(p)
      setFollowUps(f)
      setLoaded(true)
    })
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

  const addFollowUp = (horizon: Horizon) =>
    setFollowUps((prev) => [
      ...prev,
      {
        id: uid(),
        title: '',
        horizon,
        prospectId: null,
        owner: '',
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
  const overdue = openFollowUps.filter((f) => (daysUntil(f.dueOn) ?? 1) < 0).length

  const heading = view === 'pipeline' ? 'Pipeline' : 'Follow-Up'
  const blurb =
    view === 'pipeline' ? 'Opportunities' : 'Today, this week, this month'
  const stamp = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: SANS, color: FG }}>
      <style>{styles}</style>

      <aside
        style={{
          width: 180,
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
            <button className="btn-primary" onClick={() => setProspects((prev) => [...prev, blankProspect()])}>
              + New Opportunity
            </button>
          </>
        ) : (
          <>
            <StatCard label="Due Today" value={dueToday} color={dueToday > 0 ? WARN : FG} />
            <StatCard label="Overdue" value={overdue} color={overdue > 0 ? '#dc2626' : FG} />
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

          {view === 'pipeline' ? (
            <PipelineTable
              prospects={prospects}
              onProspectChange={patchProspect}
              onAssetChange={patchAsset}
              onAddAsset={addAsset}
              onDeleteAsset={deleteAsset}
              onDeleteProspect={(id) => setProspects((prev) => prev.filter((p) => p.id !== id))}
              onAddProspect={() => setProspects((prev) => [...prev, blankProspect()])}
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
    </div>
  )
}
