import { useMemo, useState } from 'react'
import type { Asset, Prospect, Stage } from '../../types'
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
import { BORDER, CARD, DANGER, FG, GRP_META, MUTED, MUTED_BG, SUCCESS, WARN } from '../../ui/theme'
import { BoxMoney, BoxSelect, BoxText, FieldRow, RecordCard } from '../../ui/primitives'
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

type Props = {
  prospects: Prospect[]
  onProspectChange: (id: string, patch: Partial<Prospect>) => void
  onAssetChange: (prospectId: string, assetId: string, patch: Partial<Asset>) => void
  onAddAsset: (prospectId: string, patch?: Partial<Asset>) => void
  onDeleteAsset: (prospectId: string, assetId: string) => void
  onDeleteProspect: (id: string) => void
  onAddProspect: () => void
}

function ProspectCard({
  prospect,
  onProspectChange,
  onAssetChange,
  onAddAsset,
  onDeleteAsset,
  onDeleteProspect,
}: {
  prospect: Prospect
  onProspectChange: (id: string, patch: Partial<Prospect>) => void
  onAssetChange: (prospectId: string, assetId: string, patch: Partial<Asset>) => void
  onAddAsset: (prospectId: string, patch?: Partial<Asset>) => void
  onDeleteAsset: (prospectId: string, assetId: string) => void
  onDeleteProspect: (id: string) => void
}) {
  const total = prospect.assets.reduce((s, a) => s + (a.amount ?? 0), 0)
  const overdue = (daysUntil(prospect.nextStepOn) ?? 1) < 0 && prospect.stage !== 'funded'
  const name = prospect.name || 'this opportunity'

  return (
    <RecordCard
      accent={STAGE_COLOR[prospect.stage]}
      deleteTitle="Delete this opportunity"
      onDelete={() => {
        if (confirm(`Delete ${name} and everything on it?`)) onDeleteProspect(prospect.id)
      }}
    >
      {/* Row 1 — who they are */}
      <FieldRow>
        <BoxText
          label="Name"
          width={180}
          value={prospect.name}
          placeholder="Last, First"
          onCommit={(v) => onProspectChange(prospect.id, { name: v })}
        />
        <BoxSelect
          label="Type"
          width={110}
          value={prospect.kind}
          options={opts(['new-prospect', 'existing-client'] as const, KIND_LABELS)}
          onCommit={(v) => onProspectChange(prospect.id, { kind: v })}
        />
        <BoxSelect
          label="From"
          width={150}
          value={prospect.source}
          options={opts(SOURCES, SOURCE_LABELS)}
          onCommit={(v) => onProspectChange(prospect.id, { source: v })}
          color={prospect.source === 'dave-ramsey' ? '#6d28d9' : undefined}
        />
        <BoxText
          label="Referred By"
          width={140}
          value={prospect.referredBy}
          onCommit={(v) => onProspectChange(prospect.id, { referredBy: v })}
        />
        <BoxText label="Phone" width={125} value={prospect.phone} onCommit={(v) => onProspectChange(prospect.id, { phone: v })} />
        <BoxText
          label="Email"
          width={170}
          type="email"
          value={prospect.email}
          onCommit={(v) => onProspectChange(prospect.id, { email: v })}
        />
      </FieldRow>

      {/* One row per account they have — a household grows taller, not the table wider */}
      {prospect.assets.map((asset) => (
        <FieldRow key={asset.id}>
          <BoxSelect
            label="Account Type"
            width={130}
            value={asset.kind}
            options={opts(ASSET_KINDS, ASSET_KIND_LABELS)}
            onCommit={(v) => onAssetChange(prospect.id, asset.id, { kind: v })}
          />
          <BoxMoney label="Amount" width={100} value={asset.amount} onCommit={(v) => onAssetChange(prospect.id, asset.id, { amount: v })} />
          <BoxText
            label="Where It's At"
            width={170}
            grow
            value={asset.heldAt}
            placeholder="Custodian or plan"
            onCommit={(v) => onAssetChange(prospect.id, asset.id, { heldAt: v })}
          />
          <BoxText
            label="Destination"
            width={170}
            grow
            value={asset.movingTo}
            placeholder="Receiving firm"
            onCommit={(v) => onAssetChange(prospect.id, asset.id, { movingTo: v })}
          />
          <BoxSelect
            label="Money Status"
            width={120}
            value={asset.status}
            options={opts(ASSET_STATUSES, ASSET_STATUS_LABELS)}
            onCommit={(v) => onAssetChange(prospect.id, asset.id, { status: v })}
            color={ASSET_STATUS_COLOR[asset.status]}
          />
          {prospect.assets.length > 1 && (
            <button
              className="b-del"
              title="Delete this account"
              onClick={() => {
                if (confirm('Delete this account?')) onDeleteAsset(prospect.id, asset.id)
              }}
              style={{ alignSelf: 'center' }}
            >
              ×
            </button>
          )}
        </FieldRow>
      ))}

      <button className="b-plus" style={{ marginBottom: 8 }} onClick={() => onAddAsset(prospect.id)}>
        + Add account
      </button>

      {/* Last row — stage and next step */}
      <FieldRow last>
        <BoxSelect
          label="Stage"
          width={150}
          value={prospect.stage}
          options={opts(STAGES, STAGE_LABELS)}
          onCommit={(v) => onProspectChange(prospect.id, { stage: v })}
          color={STAGE_COLOR[prospect.stage]}
        />
        <BoxText
          label="Next Step"
          grow
          value={prospect.nextStep}
          onCommit={(v) => onProspectChange(prospect.id, { nextStep: v })}
        />
        <div style={{ minWidth: 130, flex: '0 1 130px' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: overdue ? DANGER : MUTED,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 3,
            }}
          >
            Next Step Due
          </div>
          <input
            type="date"
            aria-label="Next step due"
            value={prospect.nextStepOn}
            onChange={(e) => onProspectChange(prospect.id, { nextStepOn: e.target.value })}
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
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: FG, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(total)}</div>
        </div>
      </FieldRow>
    </RecordCard>
  )
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

  const grandTotal = useMemo(
    () => prospects.reduce((s, p) => s + p.assets.reduce((t, a) => t + (a.amount ?? 0), 0), 0),
    [prospects],
  )

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
          All Opportunities
          <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: MUTED }}>
            {prospects.length} opportunit{prospects.length === 1 ? 'y' : 'ies'}
          </span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: FG, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(grandTotal)}</span>
        <span style={{ color: MUTED, fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: 12 }}>
          {/* Category legend, once — each field below still carries its own label */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {(['who', 'current', 'track'] as const).map((g) => {
              const m = GRP_META[g === 'current' ? 'current' : g]
              return (
                <span
                  key={g}
                  className="chip"
                  style={{ background: m.bg, color: m.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  {m.icon} {g === 'current' ? 'Accounts' : m.label}
                </span>
              )
            })}
          </div>

          {prospects.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: MUTED, fontSize: 13, background: MUTED_BG, borderRadius: 8 }}>
              No opportunities yet — add the first one below.
            </div>
          ) : (
            prospects.map((p) => (
              <ProspectCard
                key={p.id}
                prospect={p}
                onProspectChange={onProspectChange}
                onAssetChange={onAssetChange}
                onAddAsset={onAddAsset}
                onDeleteAsset={onDeleteAsset}
                onDeleteProspect={onDeleteProspect}
              />
            ))
          )}

          <button className="b-add" style={{ borderRadius: 6, border: `1px dashed ${BORDER}` }} onClick={onAddProspect}>
            + Add opportunity
          </button>
        </div>
      )}
    </div>
  )
}
