import { useEffect, useState } from 'react'
import type { Asset, EditableListKey, Prospect, Settings, SortBy, Stage } from './types'
import { DEFAULT_SETTINGS, SORTS, findStage } from './types'
import { BG, BORDER, FG, MUTED, MUTED_BG, SANS, SIDEBAR, SUCCESS, WARN, styles } from './ui/theme'
import { ActionBtn, CheckboxDropdown, Chip, SideLabel, StatCard } from './ui/primitives'
import { localRepository } from './lib/repository'
import { sampleProspects, seedProspects } from './lib/seedData'
import { blankAsset, blankProspect } from './features/pipeline/blanks'
import { PipelineBoard } from './features/pipeline/PipelineBoard'
import { ProspectDetail } from './features/pipeline/ProspectDetail'
import { SettingsPanel } from './features/settings/SettingsPanel'
import { fmtMoney, uid } from './lib/dates'

export default function App() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Both start as "no filter": sortSelection empty means "All Opportunities";
  // quickViewSelection empty means every account type. Checking any box adds
  // to the set rather than replacing it — see toggleSort/toggleQuickView.
  const [sortSelection, setSortSelection] = useState<Set<SortBy>>(new Set())
  const [quickViewSelection, setQuickViewSelection] = useState<Set<string>>(new Set())

  function toggleSort(id: SortBy) {
    setSortSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleQuickView(id: string) {
    setQuickViewSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      let p = await localRepository.loadProspects()
      const s = await localRepository.loadSettings()
      // First time this browser has ever opened the app: seed a demo
      // household so the page shows something instead of an empty state.
      // Gated on hasSeeded, not just an empty list, so deleting everything
      // later doesn't bring the demo back.
      if (p.length === 0 && !(await localRepository.hasSeeded())) {
        p = seedProspects()
        await localRepository.saveProspects(p)
        await localRepository.markSeeded()
      }
      if (cancelled) return
      setProspects(p)
      setSettings(s)
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

  // Deliberately not a write-through-on-load effect like prospects:
  // Settings merges in code defaults for anything a browser hasn't saved
  // (see loadSettings), and eagerly saving that merged result back would
  // freeze every category at whatever the defaults were on first load —
  // permanently shadowing any later change to those defaults for a browser
  // that never actually customized that category. Only persist when the
  // Settings panel itself reports an edit.
  function updateSettings(next: Settings) {
    setSettings(next)
    void localRepository.saveSettings(next)
  }

  // Typing a Next Step that isn't one of the current suggestions quietly adds
  // it to that stage's list, so it's there as a suggestion the next time
  // around — the list grows from what advisors actually type instead of only
  // what's configured up front.
  function addNextStepSuggestion(stage: string, text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const existing = settings.nextStepSuggestions[stage] ?? []
    if (existing.includes(trimmed)) return
    updateSettings({ ...settings, nextStepSuggestions: { ...settings.nextStepSuggestions, [stage]: [...existing, trimmed] } })
  }

  // Same idea as addNextStepSuggestion, for every other typeahead in the
  // record form: Account Type, From, Where It's At Now, Where It's Moving.
  // Typing something that isn't already an option quietly adds it, so the
  // list grows from what advisors actually type instead of only what's
  // configured up front.
  function addToSettingsList(key: EditableListKey, text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const existing = settings[key]
    if (existing.includes(trimmed)) return
    updateSettings({ ...settings, [key]: [...existing, trimmed] })
  }

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
      prev.map((p) =>
        p.id === prospectId ? { ...p, assets: [...p.assets, { ...blankAsset(settings.accountTypes[0] ?? ''), ...patch }] } : p,
      ),
    )

  const deleteAsset = (prospectId: string, assetId: string) =>
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, assets: p.assets.filter((a) => a.id !== assetId) } : p)),
    )

  function addProspect() {
    const defaultStage = settings.stages.find((s) => !s.offTrack)?.key ?? ''
    const p = blankProspect(defaultStage, settings.accountTypes[0] ?? '')
    setProspects((prev) => [...prev, p])
    setSelectedId(p.id)
  }

  function loadSampleData() {
    setProspects((prev) => [...prev, ...sampleProspects()])
  }

  // Same person, a new deal: keeps the contact info (name, middle initial,
  // type, from, referred by, phone, email) and who's assigned to it, but
  // starts everything deal-specific — stage, assets, next step, activity —
  // fresh, for when the same household turns up with a second, unrelated
  // opportunity.
  function duplicateProspect(id: string) {
    const p = prospects.find((x) => x.id === id)
    if (!p) return
    const defaultStage = settings.stages.find((s) => !s.offTrack)?.key ?? ''
    const now = new Date().toISOString()
    const copy: Prospect = {
      id: uid(),
      name: p.name,
      middleInitial: p.middleInitial,
      kind: p.kind,
      source: p.source,
      referredBy: p.referredBy,
      phone: p.phone,
      email: p.email,
      stage: defaultStage,
      stageChangedAt: now,
      assets: [blankAsset(settings.accountTypes[0] ?? '')],
      assignedTo: p.assignedTo,
      nextStep: '',
      nextStepStatus: 'in-process',
      nextStepOn: '',
      activity: [],
      createdAt: now,
      updatedAt: now,
    }
    setProspects((prev) => [...prev, copy])
    setSelectedId(copy.id)
  }

  function deleteProspect(id: string) {
    setProspects((prev) => prev.filter((p) => p.id !== id))
    setSelectedId((sel) => (sel === id ? null : sel))
  }

  const openProspects = prospects.filter((p) => !findStage(settings.stages, p.stage).offTrack)
  const inPlay = openProspects.reduce((s, p) => s + p.assets.reduce((t, a) => t + (a.amount ?? 0), 0), 0)
  const moving = openProspects
    .flatMap((p) => p.assets)
    .filter((a) => a.status !== 'identified' && a.status !== 'funded')
    .reduce((s, a) => s + (a.amount ?? 0), 0)
  const funded = prospects
    .filter((p) => p.stage === 'funded')
    .reduce((s, p) => s + p.assets.reduce((t, a) => t + (a.amount ?? 0), 0), 0)
  // NIGO is the only trigger for this today; more conditions can feed into
  // it later without changing what "needs attention" means to the user.
  const needsAttention = prospects
    .filter((p) => p.stage === 'nigo')
    .reduce((s, p) => s + p.assets.reduce((t, a) => t + (a.amount ?? 0), 0), 0)

  // Quick View narrows the board to opportunities holding any of the checked
  // account types (same list as the record form's Account Type field), on
  // top of whatever the Sort checklist is already doing — a second,
  // independent filter. A household can hold more than one account, so this
  // matches if any of them are one of the checked types, not just the first.
  const boardProspects =
    quickViewSelection.size === 0
      ? prospects
      : prospects.filter((p) => p.assets.some((a) => quickViewSelection.has(a.kind)))

  const sortSummary =
    sortSelection.size === 0
      ? 'All Opportunities'
      : sortSelection.size <= 2
        ? SORTS.filter((s) => sortSelection.has(s.id))
            .map((s) => s.label)
            .join(', ')
        : `${sortSelection.size} selected`

  const quickViewSummary =
    quickViewSelection.size === 0
      ? 'All Types'
      : quickViewSelection.size <= 2
        ? [...quickViewSelection].join(', ')
        : `${quickViewSelection.size} selected`

  const stamp = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const selected = prospects.find((p) => p.id === selectedId) ?? null
  // "Next" cycles through every other opportunity currently on the same
  // stage as the one that's open — only offered when there's another one.
  const sameStage = selected ? prospects.filter((p) => p.stage === selected.stage) : []
  const goToNext =
    selected && sameStage.length > 1
      ? () => {
          const i = sameStage.findIndex((p) => p.id === selected.id)
          setSelectedId(sameStage[(i + 1) % sameStage.length].id)
        }
      : undefined

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
          <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>Pipeline</div>
        </div>

        <SideLabel>Summary</SideLabel>
        <StatCard label="Total Opportunities" value={fmtMoney(inPlay)} color={FG} onClick={() => { setSortSelection(new Set()); setQuickViewSelection(new Set()) }} />
        <StatCard label="In Process" value={fmtMoney(moving)} color={WARN} onClick={() => { setSortSelection(new Set()); setQuickViewSelection(new Set()) }} />
        <StatCard label="Needs Attention" value={fmtMoney(needsAttention)} color={findStage(settings.stages, 'nigo').color} onClick={() => { setSortSelection(new Set(['nigo'])); setQuickViewSelection(new Set()) }} />
        <StatCard label="Completed" value={fmtMoney(funded)} color={SUCCESS} onClick={() => { setSortSelection(new Set(['funded'])); setQuickViewSelection(new Set()) }} />
        <StatCard label="Open Opportunities" value={openProspects.length} onClick={() => { setSortSelection(new Set()); setQuickViewSelection(new Set()) }} />
        <button className="btn-primary" onClick={addProspect}>
          + New Opportunity
        </button>
        <button
          onClick={loadSampleData}
          style={{
            display: 'block',
            width: '100%',
            background: 'none',
            color: MUTED,
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: '7px 14px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: SANS,
            marginTop: 6,
          }}
        >
          + Load sample opportunities
        </button>
      </aside>

      <div style={{ flex: 1, minWidth: 0, background: BG }}>
        <div style={{ padding: '28px 28px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: FG }}>
                  Pipeline
                </h1>
                <Chip label="Opportunities" color={MUTED} bg={MUTED_BG} border />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: MUTED }}>Russell Wealth Group &mdash; {stamp}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Quick View
                </span>
                <CheckboxDropdown
                  label="Sort opportunities"
                  summary={sortSummary}
                  options={SORTS}
                  selected={sortSelection}
                  onToggle={(id) => toggleSort(id as SortBy)}
                />
                <CheckboxDropdown
                  label="Filter by account type"
                  summary={quickViewSummary}
                  options={settings.accountTypes.filter((t) => t !== 'Other').map((t) => ({ id: t, label: t }))}
                  selected={quickViewSelection}
                  onToggle={toggleQuickView}
                />
              </div>
            </div>
            <ActionBtn label="⚙ Settings" color={MUTED} onClick={() => setSettingsOpen(true)} small />
          </div>

          <PipelineBoard
            prospects={boardProspects}
            stages={settings.stages}
            sortBy={sortSelection.size === 0 ? ['all'] : [...sortSelection]}
            onOpen={(p) => setSelectedId(p.id)}
            onAddProspect={addProspect}
          />
        </div>
      </div>

      {selected && (
        <ProspectDetail
          prospect={selected}
          settings={settings}
          onChange={(patch) => patchProspect(selected.id, patch)}
          onChangeStage={(stage) => changeStage(selected.id, stage)}
          onAssetChange={(assetId, patch) => patchAsset(selected.id, assetId, patch)}
          onAddAsset={() => addAsset(selected.id)}
          onDeleteAsset={(assetId) => deleteAsset(selected.id, assetId)}
          onAddNextStepSuggestion={addNextStepSuggestion}
          onAddListValue={addToSettingsList}
          onDelete={() => deleteProspect(selected.id)}
          onClose={() => setSelectedId(null)}
          onNext={goToNext}
          onDuplicate={() => duplicateProspect(selected.id)}
        />
      )}

      {settingsOpen && <SettingsPanel settings={settings} onChange={updateSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
