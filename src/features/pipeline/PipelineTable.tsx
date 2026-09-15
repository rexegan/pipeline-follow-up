import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Asset, Prospect, Source, Stage } from '../../types'
import {
  ASSET_KINDS,
  ASSET_KIND_LABELS,
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  KIND_LABELS,
  SOURCES,
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
} from '../../types'
import { BORDER, CARD, DANGER, FG, GRP_META, MUTED, MUTED_BG, NO_PASSWORD_MANAGER, SUCCESS, WARN } from '../../ui/theme'
import type { Group } from '../../ui/theme'
import { EmptyRow, MoneyCell, SelectCell, TextCell } from '../../ui/primitives'
import { daysUntil, fmtMoney } from '../../lib/dates'

const STAGE_COLOR: Record<Stage, string> = {
  identified: MUTED,
  contacted: '#3f3f46',
  'appointment-set': '#1d4ed8',
  'first-meeting-held': '#1d4ed8',
  'plan-presented': '#6d28d9',
  'paperwork-out': WARN,
  'transfer-in-progress': WARN,
  funded: SUCCESS,
  stalled: '#a16207',
  lost: DANGER,
}

const ASSET_STATUS_COLOR: Record<Asset['status'], string> = {
  identified: MUTED,
  paperwork: WARN,
  'in-transit': WARN,
  landed: SUCCESS,
}

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((v) => ({ value: v, label: labels[v] }))

/** `continues` marks the 2nd+ account row of the same household. */
type Row = { prospect: Prospect; asset: Asset | null; continues: boolean }

type Col = {
  key: string
  label: string
  group: Group
  w: number
  /** Prospect-scoped cells are blanked on continuation rows — one household
   *  has one stage and one next step, not one per account. */
  scope: 'prospect' | 'asset'
  render: (row: Row) => ReactNode
  foot?: (rows: Row[]) => ReactNode
}

type Props = {
  prospects: Prospect[]
  onProspectChange: (id: string, patch: Partial<Prospect>) => void
  onAssetChange: (prospectId: string, assetId: string, patch: Partial<Asset>) => void
  onAddAsset: (prospectId: string, patch?: Partial<Asset>) => void
  onDeleteAsset: (prospectId: string, assetId: string) => void
  onDeleteProspect: (id: string) => void
  onAddProspect: () => void
}

export function PipelineTable({
  prospects,
  onProspectChange,
  onAssetChange,
  onAddAsset,
  onDeleteAsset,
  onDeleteProspect,
  onAddProspect,
}: Props) {
  const [open, setOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<Stage | 'open' | ''>('open')
  const [sourceFilter, setSourceFilter] = useState<Source | ''>('')

  /** Editing an asset cell on a prospect that has none materialises the row. */
  const editAsset = (row: Row, patch: Partial<Asset>) =>
    row.asset ? onAssetChange(row.prospect.id, row.asset.id, patch) : onAddAsset(row.prospect.id, patch)

  const COLS: Col[] = [
    {
      key: 'name',
      label: 'Name',
      group: 'who',
      w: 180,
      scope: 'prospect',
      render: ({ prospect }) => (
        <TextCell
          label="Name"
          value={prospect.name}
          placeholder="Last, First"
          onCommit={(v) => onProspectChange(prospect.id, { name: v })}
        />
      ),
    },
    {
      key: 'kind',
      label: 'Type',
      group: 'who',
      w: 138,
      scope: 'prospect',
      render: ({ prospect }) => (
        <SelectCell
          label="Type"
          value={prospect.kind}
          options={opts(['new-prospect', 'existing-client'] as const, KIND_LABELS)}
          onCommit={(v) => onProspectChange(prospect.id, { kind: v })}
        />
      ),
    },
    {
      key: 'source',
      label: 'From',
      group: 'who',
      w: 165,
      scope: 'prospect',
      render: ({ prospect }) => (
        <SelectCell
          label="How we got them"
          value={prospect.source}
          options={opts(SOURCES, SOURCE_LABELS)}
          onCommit={(v) => onProspectChange(prospect.id, { source: v })}
          color={prospect.source === 'dave-ramsey' ? '#6d28d9' : undefined}
        />
      ),
    },
    {
      key: 'referredBy',
      label: 'Referred By',
      group: 'who',
      w: 150,
      scope: 'prospect',
      render: ({ prospect }) => (
        <TextCell
          label="Referred by"
          value={prospect.referredBy}
          onCommit={(v) => onProspectChange(prospect.id, { referredBy: v })}
        />
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      group: 'who',
      w: 132,
      scope: 'prospect',
      render: ({ prospect }) => (
        <TextCell label="Phone" value={prospect.phone} onCommit={(v) => onProspectChange(prospect.id, { phone: v })} />
      ),
    },
    {
      key: 'email',
      label: 'Email',
      group: 'who',
      w: 180,
      scope: 'prospect',
      render: ({ prospect }) => (
        <TextCell
          label="Email"
          type="email"
          value={prospect.email}
          onCommit={(v) => onProspectChange(prospect.id, { email: v })}
        />
      ),
    },
    {
      key: 'assetKind',
      label: 'Account Type',
      group: 'current',
      w: 140,
      scope: 'asset',
      render: (row) => (
        <SelectCell
          label="Account type"
          value={row.asset?.kind ?? '401k'}
          options={opts(ASSET_KINDS, ASSET_KIND_LABELS)}
          onCommit={(v) => editAsset(row, { kind: v })}
        />
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      group: 'current',
      w: 118,
      scope: 'asset',
      render: (row) => (
        <MoneyCell label="Amount" value={row.asset?.amount ?? null} onCommit={(v) => editAsset(row, { amount: v })} />
      ),
      foot: (rows) => fmtMoney(rows.reduce((s, r) => s + (r.asset?.amount ?? 0), 0)),
    },
    {
      key: 'heldAt',
      label: "Where It's At",
      group: 'current',
      w: 185,
      scope: 'asset',
      render: (row) => (
        <TextCell
          label="Where it's at"
          value={row.asset?.heldAt ?? ''}
          placeholder="Custodian or plan"
          onCommit={(v) => editAsset(row, { heldAt: v })}
        />
      ),
    },
    {
      key: 'movingTo',
      label: 'Destination',
      group: 'destination',
      w: 185,
      scope: 'asset',
      render: (row) => (
        <TextCell
          label="Where it needs to go"
          value={row.asset?.movingTo ?? ''}
          placeholder="Receiving firm"
          onCommit={(v) => editAsset(row, { movingTo: v })}
        />
      ),
    },
    {
      key: 'assetStatus',
      label: 'Money Status',
      group: 'destination',
      w: 132,
      scope: 'asset',
      render: (row) => (
        <SelectCell
          label="Money status"
          value={row.asset?.status ?? 'identified'}
          options={opts(ASSET_STATUSES, ASSET_STATUS_LABELS)}
          onCommit={(v) => editAsset(row, { status: v })}
          color={ASSET_STATUS_COLOR[row.asset?.status ?? 'identified']}
        />
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      group: 'track',
      w: 168,
      scope: 'prospect',
      render: ({ prospect }) => (
        <SelectCell
          label="Stage"
          value={prospect.stage}
          options={opts(STAGES, STAGE_LABELS)}
          onCommit={(v) => onProspectChange(prospect.id, { stage: v })}
          color={STAGE_COLOR[prospect.stage]}
        />
      ),
    },
    {
      key: 'nextStep',
      label: 'Next Step',
      group: 'track',
      w: 210,
      scope: 'prospect',
      render: ({ prospect }) => (
        <TextCell
          label="Next step"
          value={prospect.nextStep}
          onCommit={(v) => onProspectChange(prospect.id, { nextStep: v })}
        />
      ),
    },
    {
      key: 'nextStepOn',
      label: 'Next Step Due',
      group: 'track',
      w: 140,
      scope: 'prospect',
      render: ({ prospect }) => {
        const overdue = (daysUntil(prospect.nextStepOn) ?? 1) < 0 && prospect.stage !== 'funded'
        return (
          <div style={{ height: '100%', background: overdue ? '#fef2f2' : undefined }}>
            <TextCell
              label="Next step due"
              type="date"
              value={prospect.nextStepOn}
              onCommit={(v) => onProspectChange(prospect.id, { nextStepOn: v })}
            />
          </div>
        )
      },
    },
  ]

  const spans = useMemo(() => {
    const out: { group: Group; count: number }[] = []
    for (const col of COLS) {
      const last = out[out.length - 1]
      if (last && last.group === col.group) last.count++
      else out.push({ group: col.group, count: 1 })
    }
    return out
    // COLS is rebuilt each render but its shape is static.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows: Row[] = useMemo(() => {
    const term = search.trim().toLowerCase()
    return prospects
      .filter((p) => {
        if (stageFilter === 'open') return p.stage !== 'lost' && p.stage !== 'stalled'
        if (stageFilter === '') return true
        return p.stage === stageFilter
      })
      .filter((p) => (sourceFilter === '' ? true : p.source === sourceFilter))
      .filter((p) => {
        if (!term) return true
        const hay = [p.name, p.referredBy, p.nextStep, ...p.assets.flatMap((a) => [a.heldAt, a.movingTo])]
          .join(' ')
          .toLowerCase()
        return hay.includes(term)
      })
      .flatMap((p): Row[] =>
        p.assets.length
          ? p.assets.map((a, i) => ({ prospect: p, asset: a, continues: i > 0 }))
          : [{ prospect: p, asset: null, continues: false }],
      )
  }, [prospects, search, stageFilter, sourceFilter])

  // The header count is opportunities (households), not account rows — a
  // household with three accounts is still one opportunity.
  const opportunityCount = rows.filter((r) => !r.continues).length

  const tableWidth = COLS.reduce((s, c) => s + c.w, 0) + 64

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input
          className="filter-input"
          style={{ width: 220 }}
          placeholder="Search name, custodian, next step…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          {...NO_PASSWORD_MANAGER}
          aria-label="Search opportunities"
        />
        <select
          className="filter-input"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as Stage | 'open' | '')}
          aria-label="Filter by stage"
        >
          <option value="open">Open stages</option>
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          className="filter-input"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as Source | '')}
          aria-label="Filter by source"
        >
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          // Hug the table's own width rather than stretching full-bleed — a
          // narrower table inside a full-width card reads as empty and loose.
          width: 'fit-content',
          maxWidth: '100%',
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
            All Opportunities
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: MUTED }}>
              {opportunityCount} opportunit{opportunityCount === 1 ? 'y' : 'ies'}
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
                <col style={{ width: 64 }} />
              </colgroup>

              <thead>
                <tr>
                  {spans.map((gs, i) => {
                    const m = GRP_META[gs.group]
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
                {rows.length === 0 && (
                  <EmptyRow
                    colSpan={COLS.length + 1}
                    message={
                      prospects.length === 0
                        ? 'No opportunities yet — add the first one below.'
                        : 'No opportunities match these filters.'
                    }
                  />
                )}

                {rows.map((row) => (
                  <tr key={`${row.prospect.id}:${row.asset?.id ?? 'none'}`} className="b-row" style={{ background: CARD }}>
                    {COLS.map((c) =>
                      row.continues && c.scope === 'prospect' ? (
                        <td key={c.key} className="b-td" style={{ background: '#fcfcfd' }}>
                          {c.key === 'name' && (
                            <span style={{ padding: '0 10px', fontSize: 13, color: '#a1a1aa' }}>↳</span>
                          )}
                        </td>
                      ) : (
                        <td key={c.key} className="b-td">
                          {c.render(row)}
                        </td>
                      ),
                    )}
                    <td className="b-td" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        className="b-plus"
                        title={`Add another account for ${row.prospect.name || 'this household'}`}
                        onClick={() => onAddAsset(row.prospect.id)}
                      >
                        +
                      </button>
                      <button
                        className="b-del"
                        title={row.asset && row.prospect.assets.length > 1 ? 'Delete this account' : 'Delete this opportunity'}
                        onClick={() => {
                          const name = row.prospect.name || 'this opportunity'
                          if (row.asset && row.prospect.assets.length > 1) {
                            if (confirm(`Delete this account row for ${name}?`)) onDeleteAsset(row.prospect.id, row.asset.id)
                          } else if (confirm(`Delete ${name} and everything on it?`)) {
                            onDeleteProspect(row.prospect.id)
                          }
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan={COLS.length + 1} style={{ padding: 0, borderTop: `1px solid ${BORDER}` }}>
                    <button className="b-add" onClick={onAddProspect}>
                      + Add opportunity
                    </button>
                  </td>
                </tr>
              </tbody>

              <tfoot>
                <tr style={{ background: MUTED_BG, borderTop: `1px solid ${BORDER}` }}>
                  {COLS.map((c, i) => (
                    <td
                      key={c.key}
                      className="b-td"
                      style={{
                        padding: '8px 10px',
                        fontWeight: 600,
                        background: MUTED_BG,
                        fontSize: 12,
                        color: c.foot ? FG : MUTED,
                        textAlign: c.foot ? 'right' : 'left',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {i === 0 ? (
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: MUTED }}>
                          Totals
                        </span>
                      ) : (
                        c.foot?.(rows) ?? ''
                      )}
                    </td>
                  ))}
                  <td className="b-td" style={{ background: MUTED_BG }} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
