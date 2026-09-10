import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { FollowUp, Horizon, Prospect } from '../../types'
import { HORIZONS, HORIZON_LABELS } from '../../types'
import { BORDER, CARD, FG, FOLLOW_GRP_META, MUTED, MUTED_BG, SUCCESS, WARN } from '../../ui/theme'
import type { FollowGroup } from '../../ui/theme'
import { EmptyRow, SelectCell, TextCell } from '../../ui/primitives'
import { daysUntil } from '../../lib/dates'
import { defaultDue } from './horizons'

const HORIZON_COLOR: Record<Horizon, string> = {
  today: '#b91c1c',
  week: '#1d4ed8',
  month: '#6d28d9',
}

type Col = {
  key: string
  label: string
  group: FollowGroup
  w: number
  render: (item: FollowUp) => ReactNode
}

type Props = {
  followUps: FollowUp[]
  prospects: Prospect[]
  onChange: (id: string, patch: Partial<FollowUp>) => void
  onDelete: (id: string) => void
  onAdd: (horizon: Horizon) => void
}

export function FollowUpTable({ followUps, prospects, onChange, onDelete, onAdd }: Props) {
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [horizonFilter, setHorizonFilter] = useState<Horizon | ''>('')
  const [showDone, setShowDone] = useState(false)

  const COLS: Col[] = [
    {
      key: 'title',
      label: 'Task',
      group: 'task',
      w: 340,
      render: (item) => (
        <div style={{ height: '100%' }}>
          <TextCell
            label="Task"
            value={item.title}
            placeholder="What has to get done"
            onCommit={(v) => onChange(item.id, { title: v })}
          />
        </div>
      ),
    },
    {
      key: 'prospectId',
      label: 'Tied To',
      group: 'task',
      w: 200,
      render: (item) => (
        <SelectCell
          label="Tied to opportunity"
          value={item.prospectId ?? ''}
          options={[{ value: '', label: '—' }, ...prospects.map((p) => ({ value: p.id, label: p.name || 'Untitled' }))]}
          onCommit={(v) => onChange(item.id, { prospectId: v || null })}
        />
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      group: 'task',
      w: 130,
      render: (item) => (
        <TextCell label="Owner" value={item.owner} onCommit={(v) => onChange(item.id, { owner: v })} />
      ),
    },
    {
      key: 'horizon',
      label: 'Window',
      group: 'when',
      w: 140,
      render: (item) => (
        <SelectCell
          label="Window"
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
      ),
    },
    {
      key: 'dueOn',
      label: 'Due',
      group: 'when',
      w: 140,
      render: (item) => {
        const overdue = !item.done && (daysUntil(item.dueOn) ?? 1) < 0
        return (
          <div style={{ height: '100%', background: overdue ? '#fef2f2' : undefined }}>
            <TextCell label="Due" type="date" value={item.dueOn} onCommit={(v) => onChange(item.id, { dueOn: v })} />
          </div>
        )
      },
    },
    {
      key: 'done',
      label: 'Status',
      group: 'state',
      w: 128,
      render: (item) => (
        <SelectCell
          label="Status"
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
      ),
    },
  ]

  const spans = useMemo(() => {
    const out: { group: FollowGroup; count: number }[] = []
    for (const col of COLS) {
      const last = out[out.length - 1]
      if (last && last.group === col.group) last.count++
      else out.push({ group: col.group, count: 1 })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return followUps
      .filter((f) => (showDone ? true : !f.done))
      .filter((f) => (horizonFilter === '' ? true : f.horizon === horizonFilter))
      .filter((f) => (term ? f.title.toLowerCase().includes(term) || f.owner.toLowerCase().includes(term) : true))
      .sort((a, b) => HORIZONS.indexOf(a.horizon) - HORIZONS.indexOf(b.horizon) || a.dueOn.localeCompare(b.dueOn))
  }, [followUps, search, horizonFilter, showDone])

  const tableWidth = COLS.reduce((s, c) => s + c.w, 0) + 44

  /** Rows carry a window divider so the three commitment windows stay legible. */
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
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <input
          className="filter-input"
          style={{ width: 240 }}
          placeholder="Search tasks and owners…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search follow-ups"
        />
        <select
          className="filter-input"
          value={horizonFilter}
          onChange={(e) => setHorizonFilter(e.target.value as Horizon | '')}
          aria-label="Filter by window"
        >
          <option value="">All windows</option>
          {HORIZONS.map((h) => (
            <option key={h} value={h}>
              {HORIZON_LABELS[h]}
            </option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED }}>
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Show done
        </label>
      </div>

      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
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
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: MUTED }}>
              {visible.length} shown
            </span>
          </span>
          <span style={{ color: MUTED, fontSize: 11 }}>{open ? '▲' : '▼'}</span>
        </div>

        {open && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: tableWidth, background: CARD }}>
              <colgroup>
                {COLS.map((c) => (
                  <col key={c.key} style={{ width: c.w }} />
                ))}
                <col style={{ width: 44 }} />
              </colgroup>

              <thead>
                <tr>
                  {spans.map((gs, i) => {
                    const m = FOLLOW_GRP_META[gs.group]
                    return (
                      <th key={i} colSpan={gs.count} className="b-th1" style={{ background: m.bg, color: m.color }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span>{m.icon}</span>
                          {m.label}
                        </span>
                      </th>
                    )
                  })}
                  <th className="b-th1" style={{ background: MUTED_BG }} />
                </tr>
                <tr>
                  {COLS.map((c) => (
                    <th key={c.key} className="b-th2">
                      {c.label}
                    </th>
                  ))}
                  <th className="b-th2" />
                </tr>
              </thead>

              <tbody>
                {withDividers.length === 0 && (
                  <EmptyRow
                    colSpan={COLS.length + 1}
                    message={followUps.length === 0 ? 'Nothing committed yet.' : 'Nothing matches these filters.'}
                  />
                )}

                {withDividers.map((entry) =>
                  entry.kind === 'divider' ? (
                    <tr key={`div:${entry.horizon}`}>
                      <td
                        colSpan={COLS.length + 1}
                        style={{
                          background: MUTED_BG,
                          borderBottom: `1px solid ${BORDER}`,
                          borderTop: `1px solid ${BORDER}`,
                          padding: '5px 12px',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: HORIZON_COLOR[entry.horizon],
                        }}
                      >
                        {HORIZON_LABELS[entry.horizon]}
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={entry.item.id}
                      className="b-row"
                      style={{ background: CARD, opacity: entry.item.done ? 0.55 : 1 }}
                    >
                      {COLS.map((c) => (
                        <td key={c.key} className="b-td">
                          {c.render(entry.item)}
                        </td>
                      ))}
                      <td className="b-td" style={{ textAlign: 'center' }}>
                        <button
                          className="b-del"
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Delete "${entry.item.title || 'this follow-up'}"?`)) onDelete(entry.item.id)
                          }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ),
                )}

                <tr>
                  <td colSpan={COLS.length + 1} style={{ padding: 0, borderTop: `1px solid ${BORDER}` }}>
                    <button className="b-add" onClick={() => onAdd(horizonFilter || 'today')}>
                      + Add follow-up
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
