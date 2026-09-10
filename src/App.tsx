import { useEffect, useState } from 'react'
import type { FollowUp, Prospect } from './types'
import { C, FONT_HEAD, styles } from './ui/theme'
import { Icon } from './ui/Icon'
import { localRepository } from './lib/repository'
import { PipelineSection } from './features/pipeline/PipelineSection'
import { FollowUpSection } from './features/followup/FollowUpSection'

const SECTIONS = [
  { id: 'pipeline', label: 'Pipeline', icon: 'briefcase', color: C.bannerBlue },
  { id: 'followup', label: 'Follow-up', icon: 'clipboard', color: C.bannerRust },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export default function App() {
  const [active, setActive] = useState<SectionId>('pipeline')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loaded, setLoaded] = useState(false)
  const [prefillProspect, setPrefillProspect] = useState<Prospect | null>(null)

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

  function saveProspect(prospect: Prospect) {
    setProspects((prev) =>
      prev.some((p) => p.id === prospect.id)
        ? prev.map((p) => (p.id === prospect.id ? prospect : p))
        : [prospect, ...prev],
    )
  }

  function saveFollowUp(followUp: FollowUp) {
    setFollowUps((prev) =>
      prev.some((f) => f.id === followUp.id)
        ? prev.map((f) => (f.id === followUp.id ? followUp : f))
        : [followUp, ...prev],
    )
  }

  function addFollowUpFor(prospect: Prospect) {
    setPrefillProspect(prospect)
    setActive('followup')
  }

  const activeSection = SECTIONS.find((s) => s.id === active)!

  return (
    <div style={{ minHeight: '100vh', background: C.page }}>
      <style>{styles}</style>

      <div
        style={{
          background: C.surface,
          borderBottom: `3px solid ${C.accent}`,
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 38, fontWeight: 700, color: C.accent, lineHeight: 1.1, fontFamily: FONT_HEAD }}>
            Russell Wealth Group
          </div>
          <div style={{ fontSize: 19, color: C.text, fontWeight: 700, marginTop: 4, letterSpacing: '0.08em' }}>
            PIPELINE &amp; FOLLOW-UP
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 17, color: C.muted }}>Today</div>
          <div style={{ fontSize: 19, color: C.text, fontWeight: 500, marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '28px 32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            marginBottom: 26,
            background: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          {SECTIONS.map((s) => {
            const isActive = active === s.id
            const count = s.id === 'pipeline' ? prospects.length : followUps.filter((f) => !f.done).length
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '14px 8px',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 20,
                  background: isActive ? s.color : C.surface,
                  color: isActive ? '#ffffff' : C.text,
                  transition: 'all 0.12s',
                  lineHeight: 1.3,
                }}
              >
                <Icon name={s.icon} size={30} />
                <span>
                  {s.label} {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
                </span>
              </button>
            )
          })}
        </div>

        <div
          className="cat-banner"
          style={{
            marginBottom: 20,
            background: activeSection.color,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 34,
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }}
        >
          <Icon name={activeSection.icon} size={28} color="#ffffff" />
          <span>{activeSection.label}</span>
          <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 600, opacity: 0.9 }}>
            {activeSection.id === 'pipeline' ? 'Opportunities we have uncovered' : 'What has to get done'}
          </span>
        </div>

        {active === 'pipeline' && (
          <PipelineSection
            prospects={prospects}
            onSave={saveProspect}
            onChange={(id, patch) => setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))}
            onDelete={(id) => setProspects((prev) => prev.filter((p) => p.id !== id))}
            onAddFollowUp={addFollowUpFor}
          />
        )}

        {active === 'followup' && (
          <FollowUpSection
            followUps={followUps}
            prospects={prospects}
            prefillProspect={prefillProspect}
            onClearPrefill={() => setPrefillProspect(null)}
            onSave={saveFollowUp}
            onChange={(id, patch) => setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))}
            onDelete={(id) => setFollowUps((prev) => prev.filter((f) => f.id !== id))}
          />
        )}
      </div>
    </div>
  )
}
