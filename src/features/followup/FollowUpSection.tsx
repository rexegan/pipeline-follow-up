import { useState } from 'react'
import type { FollowUp, Horizon, Prospect } from '../../types'
import { HORIZONS, HORIZON_LABELS } from '../../types'
import { C } from '../../ui/theme'
import { Icon } from '../../ui/Icon'
import { ActionBtn, Badge, Card, Field, SubHead } from '../../ui/primitives'
import { endOfMonth, endOfWeek, fmtDate, today, uid } from '../../lib/dates'

const HORIZON_COLORS: Record<Horizon, string> = {
  today: C.bannerRust,
  week: C.accent,
  month: C.purple,
}

const HORIZON_ICONS: Record<Horizon, string> = {
  today: 'alert',
  week: 'calendar',
  month: 'target',
}

/** A sensible default due date for each commitment window. */
const defaultDue = (horizon: Horizon): string =>
  horizon === 'today' ? today() : horizon === 'week' ? endOfWeek() : endOfMonth()

const blankFollowUp = (horizon: Horizon = 'today', prospectId: string | null = null): FollowUp => ({
  id: uid(),
  title: '',
  horizon,
  prospectId,
  owner: '',
  dueOn: defaultDue(horizon),
  done: false,
  completedAt: null,
  createdAt: new Date().toISOString(),
})

type Props = {
  followUps: FollowUp[]
  prospects: Prospect[]
  /** Set when the user clicked "+ Follow-up" on a pipeline card; prefills the composer. */
  prefillProspect: Prospect | null
  onClearPrefill: () => void
  onSave: (followUp: FollowUp) => void
  onChange: (id: string, patch: Partial<FollowUp>) => void
  onDelete: (id: string) => void
}

export function FollowUpSection({
  followUps,
  prospects,
  prefillProspect,
  onClearPrefill,
  onSave,
  onChange,
  onDelete,
}: Props) {
  // Open the composer when the pipeline hands us a prospect. That arrives two
  // ways: this section mounts with one already set (the usual case, since
  // clicking "+ Follow-up" switches tabs), or the prop changes while mounted.
  // The initializer covers the first, the render-time adjustment the second —
  // an effect would cover both but at the cost of an extra render pass.
  const [draft, setDraft] = useState<FollowUp | null>(() =>
    prefillProspect ? blankFollowUp('today', prefillProspect.id) : null,
  )
  const [lastPrefill, setLastPrefill] = useState<Prospect | null>(prefillProspect)
  if (prefillProspect !== lastPrefill) {
    setLastPrefill(prefillProspect)
    if (prefillProspect) setDraft(blankFollowUp('today', prefillProspect.id))
  }

  const prospectName = (id: string | null) => prospects.find((p) => p.id === id)?.name ?? null

  function closeComposer() {
    setDraft(null)
    onClearPrefill()
  }

  function saveDraft() {
    if (!draft) return
    const title = draft.title.trim()
    if (!title) return
    onSave({ ...draft, title })
    closeComposer()
  }

  function quickAdd(horizon: Horizon, title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    onSave({ ...blankFollowUp(horizon), title: trimmed })
  }

  function toggle(item: FollowUp) {
    onChange(item.id, {
      done: !item.done,
      completedAt: item.done ? null : new Date().toISOString(),
    })
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <ActionBtn label="+ New follow-up" color={C.bannerRust} onClick={() => setDraft(blankFollowUp())} />
        <span style={{ fontSize: 18, color: C.muted }}>
          {followUps.filter((f) => !f.done).length} open · {followUps.filter((f) => f.done).length} done
        </span>
      </div>

      {draft && (
        <Card accent={C.bannerRust} style={{ marginBottom: 22 }}>
          <SubHead
            label={prospectName(draft.prospectId) ? `Follow-up for ${prospectName(draft.prospectId)}` : 'New follow-up'}
            color={C.bannerRust}
            icon="clipboard"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Field
              label="What has to get done"
              value={draft.title}
              onChange={(v) => setDraft({ ...draft, title: v })}
              placeholder="Call the 401(k) provider for transfer paperwork"
            />
            <Field
              label="When"
              value={draft.horizon}
              onChange={(v) =>
                setDraft({ ...draft, horizon: v as Horizon, dueOn: defaultDue(v as Horizon) })
              }
              options={HORIZONS.map((h) => ({ value: h, label: HORIZON_LABELS[h] }))}
            />
            <Field label="Due" type="date" value={draft.dueOn} onChange={(v) => setDraft({ ...draft, dueOn: v })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 16 }}>
            <Field label="Owner" value={draft.owner} onChange={(v) => setDraft({ ...draft, owner: v })} placeholder="Who does it" />
            <Field
              label="Tied to opportunity"
              value={draft.prospectId ?? ''}
              onChange={(v) => setDraft({ ...draft, prospectId: v || null })}
              options={[{ value: '', label: 'Not tied to a specific opportunity' }, ...prospects.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <ActionBtn label="Save follow-up" color={C.bannerRust} onClick={saveDraft} />
            <ActionBtn label="Cancel" color={C.muted} onClick={closeComposer} />
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
        {HORIZONS.map((horizon) => {
          const items = followUps.filter((f) => f.horizon === horizon)
          const open = items.filter((f) => !f.done)
          const done = items.filter((f) => f.done)
          const color = HORIZON_COLORS[horizon]

          return (
            <div key={horizon} style={{ border: `1px solid ${C.border}`, background: C.surface, borderRadius: 8, overflow: 'hidden' }}>
              <div
                className="cat-banner"
                style={{ background: color, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 24 }}
              >
                <Icon name={HORIZON_ICONS[horizon]} size={22} color="#fff" />
                <span>{HORIZON_LABELS[horizon]}</span>
                <span style={{ marginLeft: 'auto', fontSize: 19, fontWeight: 600 }}>
                  {done.length}/{items.length}
                </span>
              </div>

              <div style={{ padding: 12 }}>
                <input
                  aria-label={`Quick add to ${HORIZON_LABELS[horizon]}`}
                  placeholder="+ Add and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      quickAdd(horizon, e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  style={{
                    width: '100%',
                    background: C.panel,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 19,
                    color: C.text,
                    outline: 'none',
                    marginBottom: 12,
                  }}
                />

                {items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 8px', color: C.muted, fontSize: 18 }}>
                    Nothing committed for {HORIZON_LABELS[horizon].toLowerCase()}.
                  </div>
                )}

                {[...open, ...done].map((item) => {
                  const linked = prospectName(item.prospectId)
                  return (
                    <div
                      key={item.id}
                      className="row-hover"
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '10px 8px',
                        borderTop: `1px solid ${C.border}`,
                        alignItems: 'flex-start',
                        opacity: item.done ? 0.55 : 1,
                      }}
                    >
                      <button
                        aria-label={item.done ? `Reopen ${item.title}` : `Complete ${item.title}`}
                        onClick={() => toggle(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: item.done ? C.green : C.muted, flexShrink: 0 }}
                      >
                        <Icon name={item.done ? 'checkCircle' : 'circle'} size={24} />
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: C.text,
                            textDecoration: item.done ? 'line-through' : 'none',
                            lineHeight: 1.3,
                          }}
                        >
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 6 }}>
                          {linked && <Badge label={linked} color={C.accent} />}
                          {item.owner && <span style={{ fontSize: 17, color: C.muted }}>{item.owner}</span>}
                          <span style={{ fontSize: 17, color: C.muted }}>{fmtDate(item.dueOn)}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        <select
                          aria-label={`Move ${item.title}`}
                          value={item.horizon}
                          onChange={(e) => onChange(item.id, { horizon: e.target.value as Horizon })}
                          style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 16, padding: '3px 5px', color: C.text }}
                        >
                          {HORIZONS.map((h) => (
                            <option key={h} value={h}>
                              {HORIZON_LABELS[h]}
                            </option>
                          ))}
                        </select>
                        <button
                          aria-label={`Delete ${item.title}`}
                          onClick={() => onDelete(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, padding: 2 }}
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 17, color: C.muted, marginTop: 18, fontStyle: 'italic' }}>
        These are commitment windows, not calendar buckets. "This month" is the placeholder for the
        12 Week Year cycle view — that part isn't built yet.
      </p>
    </div>
  )
}
