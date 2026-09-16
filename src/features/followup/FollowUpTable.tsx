import { useMemo, useState } from 'react'
import type { FollowUp, Horizon, Prospect } from '../../types'
import { HORIZONS, HORIZON_LABELS } from '../../types'
import { BORDER, CARD, FG, MUTED, MUTED_BG, SUCCESS, WARN } from '../../ui/theme'
import { BoxSelect, BoxText, FieldRow, RecordCard } from '../../ui/primitives'
import { daysUntil } from '../../lib/dates'
import { defaultDue } from './horizons'

const HORIZON_COLOR: Record<Horizon, string> = {
  today: '#b91c1c',
  week: '#1d4ed8',
  month: '#6d28d9',
}

type Props = {
  followUps: FollowUp[]
  prospects: Prospect[]
  onChange: (id: string, patch: Partial<FollowUp>) => void
  onDelete: (id: string) => void
  onAdd: (horizon: Horizon) => void
}

function FollowUpCard({
  item,
  prospects,
  onChange,
  onDelete,
}: {
  item: FollowUp
  prospects: Prospect[]
  onChange: (id: string, patch: Partial<FollowUp>) => void
  onDelete: () => void
}) {
  const overdue = !item.done && (daysUntil(item.dueOn) ?? 1) < 0

  return (
    <RecordCard accent={HORIZON_COLOR[item.horizon]} deleteTitle="Delete" onDelete={onDelete}>
      <div style={{ opacity: item.done ? 0.55 : 1 }}>
        <FieldRow>
          <BoxText
            label="What Has To Get Done"
            grow
            value={item.title}
            placeholder="What has to get done"
            onCommit={(v) => onChange(item.id, { title: v })}
          />
          <BoxSelect
            label="Tied To"
            width={170}
            value={item.prospectId ?? ''}
            options={[{ value: '', label: '—' }, ...prospects.map((p) => ({ value: p.id, label: p.name || 'Untitled' }))]}
            onCommit={(v) => onChange(item.id, { prospectId: v || null })}
          />
          <BoxText label="Owner" width={120} value={item.owner} onCommit={(v) => onChange(item.id, { owner: v })} />
        </FieldRow>

        <FieldRow last>
          <BoxSelect
            label="Window"
            width={130}
            value={item.horizon}
            options={HORIZONS.map((h) => ({ value: h, label: HORIZON_LABELS[h] }))}
            onCommit={(v) => {
              // Carry the due date to the new window only when it is still the
              // untouched default — a hand-picked date is the user's, not ours.
              const patch: Partial<FollowUp> = { horizon: v }
              if (item.dueOn === defaultDue(item.horizon)) patch.dueOn = defaultDue(v)
              onChange(item.id, patch)
            }}
            color={HORIZON_COLOR[item.horizon]}
          />
          <div style={{ minWidth: 130, flex: '0 1 130px' }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: overdue ? '#dc2626' : MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 3,
              }}
            >
              Due
            </div>
            <input
              type="date"
              aria-label="Due"
              value={item.dueOn}
              onChange={(e) => onChange(item.id, { dueOn: e.target.value })}
              className="box-input"
              style={{
                width: '100%',
                height: 30,
                padding: '0 8px',
                fontSize: 13,
                color: FG,
                background: overdue ? '#fef2f2' : '#fff',
                border: `1px solid ${overdue ? '#fecaca' : BORDER}`,
                borderRadius: 6,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <BoxSelect
            label="Status"
            width={110}
            value={item.done ? 'done' : 'open'}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'done', label: 'Done' },
            ]}
            onCommit={(v) =>
              onChange(item.id, { done: v === 'done', completedAt: v === 'done' ? new Date().toISOString() : null })
            }
            color={item.done ? SUCCESS : WARN}
          />
        </FieldRow>
      </div>
    </RecordCard>
  )
}

export function FollowUpTable({ followUps, prospects, onChange, onDelete, onAdd }: Props) {
  const [open, setOpen] = useState(true)

  // Every follow-up, same as the blotter shows every transaction — done items
  // stay on the sheet, just faded, rather than dropping out of view.
  const visible = useMemo(() => {
    return [...followUps].sort(
      (a, b) => HORIZONS.indexOf(a.horizon) - HORIZONS.indexOf(b.horizon) || a.dueOn.localeCompare(b.dueOn),
    )
  }, [followUps])

  /** Cards carry a window divider so the three commitment windows stay legible. */
  const withDividers: ({ kind: 'divider'; horizon: Horizon } | { kind: 'item'; item: FollowUp })[] = []
  let seen: Horizon | null = null
  for (const item of visible) {
    if (item.horizon !== seen) {
      withDividers.push({ kind: 'divider', horizon: item.horizon })
      seen = item.horizon
    }
    withDividers.push({ kind: 'item', item })
  }

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '13px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: open ? `1px solid ${BORDER}` : 'none',
          background: CARD,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: FG, flex: 1 }}>
          Commitments
          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: MUTED }}>{visible.length} shown</span>
        </span>
        <span style={{ color: MUTED, fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: 12 }}>
          {withDividers.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: MUTED, fontSize: 13, background: MUTED_BG, borderRadius: 8 }}>
              Nothing committed yet.
            </div>
          )}

          {withDividers.map((entry) =>
            entry.kind === 'divider' ? (
              <div
                key={`div:${entry.horizon}`}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: HORIZON_COLOR[entry.horizon],
                  padding: '10px 2px 4px',
                }}
              >
                {HORIZON_LABELS[entry.horizon]}
              </div>
            ) : (
              <FollowUpCard
                key={entry.item.id}
                item={entry.item}
                prospects={prospects}
                onChange={onChange}
                onDelete={() => {
                  if (confirm(`Delete "${entry.item.title || 'this follow-up'}"?`)) onDelete(entry.item.id)
                }}
              />
            ),
          )}

          <button className="b-add" style={{ borderRadius: 6, border: `1px dashed ${BORDER}` }} onClick={() => onAdd('today')}>
            + Add follow-up
          </button>
        </div>
      )}
    </div>
  )
}
