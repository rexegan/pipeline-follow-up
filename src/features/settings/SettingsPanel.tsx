import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Settings, StageDef } from '../../types'
import { BORDER, CARD, DANGER, FG, MUTED, MUTED_BG, SANS } from '../../ui/theme'
import { ActionBtn, Modal } from '../../ui/primitives'
import { slugify } from '../../lib/slugify'

const STAGE_PALETTE = [
  '#1d4ed8', '#6d28d9', '#0f766e', '#a16207', '#b91c1c',
  '#0891b2', '#4d7c0f', '#9333ea', '#be185d', '#0369a1',
]

function nextStageColor(existing: StageDef[]): string {
  return STAGE_PALETTE[existing.length % STAGE_PALETTE.length]
}

function uniqueStageKey(base: string, existing: StageDef[]): string {
  let key = base
  let n = 2
  while (existing.some((s) => s.key === key)) {
    key = `${base}-${n}`
    n += 1
  }
  return key
}

const inputStyle = { border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13, fontFamily: SANS, padding: '0 8px', height: 32 }

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: hint ? 2 : 8 }}>
        {title}
      </div>
      {hint && <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  )
}

/** One editable list — add a new value, or remove an existing one. Used for
 * every plain string category (custodians, account types, sources, next
 * step suggestions); Stage gets its own richer rows below. */
function EditableList({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (!v || values.includes(v)) return
    onChange([...values, v])
    setDraft('')
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {values.length === 0 && <span style={{ fontSize: 12, color: MUTED }}>Nothing yet.</span>}
        {values.map((v) => (
          <span
            key={v}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: MUTED_BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 999,
              padding: '4px 4px 4px 10px',
              fontSize: 12.5,
              color: FG,
            }}
          >
            {v}
            <button
              onClick={() => onChange(values.filter((x) => x !== v))}
              title={`Remove ${v}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontWeight: 700, fontSize: 13, lineHeight: 1, padding: '2px 4px' }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
        />
        <ActionBtn label="Add" small onClick={add} />
      </div>
    </div>
  )
}

type Props = {
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onChange, onClose }: Props) {
  const [stageDraft, setStageDraft] = useState('')
  const [suggestionStageKey, setSuggestionStageKey] = useState(settings.stages[0]?.key ?? '')

  function addStage() {
    const label = stageDraft.trim()
    if (!label) return
    const key = uniqueStageKey(slugify(label), settings.stages)
    const stage: StageDef = { key, label, shortLabel: label, formLabel: label, color: nextStageColor(settings.stages), offTrack: false }
    onChange({ ...settings, stages: [...settings.stages, stage] })
    setStageDraft('')
  }

  function removeStage(key: string) {
    const target = settings.stages.find((s) => s.key === key)
    const activeCount = settings.stages.filter((s) => !s.offTrack).length
    if (target && !target.offTrack && activeCount <= 1) {
      alert('Keep at least one active stage on the board.')
      return
    }
    onChange({ ...settings, stages: settings.stages.filter((s) => s.key !== key) })
    if (suggestionStageKey === key) {
      setSuggestionStageKey(settings.stages.find((s) => s.key !== key)?.key ?? '')
    }
  }

  function toggleOffTrack(key: string) {
    onChange({ ...settings, stages: settings.stages.map((s) => (s.key === key ? { ...s, offTrack: !s.offTrack } : s)) })
  }

  const suggestions = settings.nextStepSuggestions[suggestionStageKey] ?? []

  return (
    <Modal onClose={onClose} width={1180}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: FG }}>Settings</div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 20, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '18px 20px', maxHeight: '88vh', overflowY: 'auto' }}>
        <Section
          title="Stage"
          hint={'The board’s columns, left to right. Check "Stalled / lost" for a stage that means the opportunity fell through rather than moved forward — instead of its own column, it collapses into a strip below the board.'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {settings.stages.map((s) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 8px' }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: FG, flex: 1 }}>{s.label}</span>
                <label
                  title="Checked: this stage means the opportunity stalled or fell through, and collapses into a strip below the board instead of getting a column. Unchecked: it's a normal step toward funding."
                  style={{ fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                >
                  <input type="checkbox" checked={s.offTrack} onChange={() => toggleOffTrack(s.key)} />
                  Stalled / lost
                </label>
                <button
                  onClick={() => removeStage(s.key)}
                  title={`Remove ${s.label}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: DANGER, fontWeight: 700, fontSize: 14, padding: '0 4px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={stageDraft}
              onChange={(e) => setStageDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStage()}
              placeholder="Add a stage…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <ActionBtn label="Add" small onClick={addStage} />
          </div>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '0 28px' }}>
          <Section title="Where It's At Now / Where It's Moving" hint="One shared list of custodians and carriers — both fields pick from it.">
            <EditableList
              values={settings.custodians}
              onChange={(custodians) => onChange({ ...settings, custodians })}
              placeholder="Add a custodian or firm…"
            />
          </Section>

          <Section title="Account Type">
            <EditableList
              values={settings.accountTypes}
              onChange={(accountTypes) => onChange({ ...settings, accountTypes })}
              placeholder="Add an account type…"
            />
          </Section>

          <Section title="From">
            <EditableList values={settings.sources} onChange={(sources) => onChange({ ...settings, sources })} placeholder="Add a source…" />
          </Section>

          <Section title="Next Step" hint="Suggestions offered in the Next Step field — different per stage.">
            <select
              value={suggestionStageKey}
              onChange={(e) => setSuggestionStageKey(e.target.value)}
              style={{ ...inputStyle, background: CARD, marginBottom: 8 }}
            >
              {settings.stages.map((s) => (
                <option key={s.key} value={s.key}>
                  Suggestions for {s.label}
                </option>
              ))}
            </select>
            <EditableList
              values={suggestions}
              onChange={(list) =>
                onChange({ ...settings, nextStepSuggestions: { ...settings.nextStepSuggestions, [suggestionStageKey]: list } })
              }
              placeholder="Add a suggested next step…"
            />
          </Section>
        </div>
      </div>
    </Modal>
  )
}
