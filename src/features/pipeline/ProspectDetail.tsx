import type { Asset, EditableListKey, Prospect, Settings, Stage } from '../../types'
import {
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  KIND_LABELS,
  NEXT_STEP_STATUSES,
  NEXT_STEP_STATUS_LABELS,
  findStage,
} from '../../types'
import { BORDER, DANGER, FG, MUTED, SUCCESS } from '../../ui/theme'
import { ActionBtn, BoxMoney, BoxPhone, BoxSelect, BoxText, FieldRow, Modal, ReadOnlyBox, TypeaheadSelect } from '../../ui/primitives'
import { fmtMoney } from '../../lib/dates'
import { formatElapsed, useElapsedMs } from '../../lib/useElapsed'
import { ASSET_STATUS_COLOR } from './stageColors'

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((v) => ({ value: v, label: labels[v] }))

const listOpts = (values: string[]) => values.map((v) => ({ value: v, label: v }))

// `Prospect.name` stays one "Last, First" string everywhere else in the app
// (board cards, search, duplicate) — only the Intake row shows it as two
// boxes, split/joined here rather than changing the stored shape.
function splitName(name: string): { last: string; first: string } {
  const i = name.indexOf(',')
  return i === -1 ? { last: name, first: '' } : { last: name.slice(0, i).trim(), first: name.slice(i + 1).trim() }
}

function joinName(last: string, first: string): string {
  const l = last.trim()
  const f = first.trim()
  if (!l) return f
  return f ? `${l}, ${f}` : l
}

type Props = {
  prospect: Prospect
  settings: Settings
  onChange: (patch: Partial<Prospect>) => void
  onChangeStage: (stage: Stage) => void
  onAssetChange: (assetId: string, patch: Partial<Asset>) => void
  onAddAsset: () => void
  onDeleteAsset: (assetId: string) => void
  onAddNextStepSuggestion: (stage: string, text: string) => void
  /** Quietly saves a typed value that isn't already an option in that Settings list. */
  onAddListValue: (key: EditableListKey, text: string) => void
  onDelete: () => void
  onClose: () => void
  /** Cycles to the next opportunity in the same stage — only offered when there is one. */
  onNext?: () => void
  /** Opens a new record for the same person/contact info, with a blank deal. */
  onDuplicate: () => void
}

export function ProspectDetail({
  prospect,
  settings,
  onChange,
  onChangeStage,
  onAssetChange,
  onAddAsset,
  onDeleteAsset,
  onAddNextStepSuggestion,
  onAddListValue,
  onDelete,
  onClose,
  onNext,
  onDuplicate,
}: Props) {
  const total = prospect.assets.reduce((s, a) => s + (a.amount ?? 0), 0)
  const stageDef = findStage(settings.stages, prospect.stage)
  const offTrack = stageDef.offTrack
  const { last: lastName, first: firstName } = splitName(prospect.name)

  // The clock runs from the moment the opportunity was opened until every
  // account has landed — not the Stage (which can say "Funded" before the
  // last account actually settles), the per-asset Status.
  const isFunded = prospect.assets.length > 0 && prospect.assets.every((a) => a.status === 'funded')
  const elapsedMs = useElapsedMs(prospect.createdAt, isFunded)

  return (
    <Modal onClose={onClose} width={1180}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 20px 8px',
          borderBottom: `1px solid ${BORDER}`,
          borderLeft: `4px solid ${stageDef.color}`,
          borderTopLeftRadius: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: FG }}>{prospect.name || 'Untitled opportunity'}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
            {stageDef.label}
            {offTrack && <span style={{ color: DANGER, fontWeight: 600 }}> · off track</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: FG, fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(total)}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 20, padding: '2px 6px', marginTop: 0, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '8px 20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          Intake
        </div>
          <FieldRow>
            <BoxText label="Last Name" width={110} value={lastName} onCommit={(v) => onChange({ name: joinName(v, firstName) })} />
            <BoxText label="First Name" width={110} value={firstName} onCommit={(v) => onChange({ name: joinName(lastName, v) })} />
            <BoxText label="MI" width={50} value={prospect.middleInitial} onCommit={(v) => onChange({ middleInitial: v })} />
            <BoxSelect
              label="Type"
              width={100}
              value={prospect.kind}
              options={opts(['new-prospect', 'existing-client'] as const, KIND_LABELS)}
              onCommit={(v) => onChange({ kind: v })}
            />
            <TypeaheadSelect
              label="From"
              width={130}
              value={prospect.source}
              options={listOpts(settings.sources)}
              onCommit={(v) => {
                onChange({ source: v })
                onAddListValue('sources', v)
              }}
              placeholder="Type a source…"
            />
            <BoxText label="Referred By" width={150} value={prospect.referredBy} onCommit={(v) => onChange({ referredBy: v })} />
            <ReadOnlyBox label="Start" width={140} value={formatElapsed(elapsedMs)} done={isFunded} />
          </FieldRow>
          <FieldRow>
            <ReadOnlyBox label="Total" width={110} value={fmtMoney(total)} />
            <BoxPhone label="Phone" width={140} value={prospect.phone} onCommit={(v) => onChange({ phone: v })} />
            <BoxText label="Email" width={240} type="email" value={prospect.email} onCommit={(v) => onChange({ email: v })} />
          </FieldRow>

          <div style={{ display: 'flex', gap: 8, margin: '14px 0 4px' }}>
            <div style={{ width: 361, textAlign: 'center', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Account
            </div>
          </div>
          {prospect.assets.map((asset) => (
            <FieldRow key={asset.id}>
              <TypeaheadSelect
                label="Account Type"
                width={120}
                value={asset.kind}
                options={listOpts(settings.accountTypes)}
                onCommit={(v) => {
                  onAssetChange(asset.id, { kind: v })
                  onAddListValue('accountTypes', v)
                }}
                placeholder="Type a kind…"
              />
              <BoxMoney label="Amount" width={95} value={asset.amount} onCommit={(v) => onAssetChange(asset.id, { amount: v })} />
              <TypeaheadSelect
                label="Held At"
                width={130}
                value={asset.heldAt}
                options={listOpts(settings.custodiansHeldAt)}
                onCommit={(v) => {
                  onAssetChange(asset.id, { heldAt: v })
                  onAddListValue('custodiansHeldAt', v)
                }}
                placeholder="Type a firm…"
              />
              <TypeaheadSelect
                label="New Account Type"
                width={115}
                value={asset.newAccountType}
                options={listOpts(settings.accountTypes)}
                onCommit={(v) => {
                  onAssetChange(asset.id, { newAccountType: v })
                  onAddListValue('accountTypes', v)
                }}
                placeholder="Type a kind…"
              />
              <TypeaheadSelect
                label="New Custodian"
                width={140}
                value={asset.movingTo}
                options={listOpts(settings.custodiansMovingTo)}
                onCommit={(v) => {
                  onAssetChange(asset.id, { movingTo: v })
                  onAddListValue('custodiansMovingTo', v)
                }}
                placeholder="Type a firm…"
              />
              <TypeaheadSelect
                label="Investment Type"
                width={115}
                value={asset.investmentType}
                options={listOpts(settings.investmentTypes)}
                onCommit={(v) => {
                  onAssetChange(asset.id, { investmentType: v })
                  onAddListValue('investmentTypes', v)
                }}
                placeholder="Type or choose…"
              />
              <TypeaheadSelect
                label="Product Name"
                width={130}
                value={asset.productName}
                options={listOpts(settings.productNames)}
                onCommit={(v) => {
                  onAssetChange(asset.id, { productName: v })
                  onAddListValue('productNames', v)
                }}
                placeholder="Type a product…"
              />
              <BoxSelect
                label="Status"
                width={110}
                value={asset.status}
                options={opts(ASSET_STATUSES, ASSET_STATUS_LABELS)}
                onCommit={(v) => onAssetChange(asset.id, { status: v })}
                color={ASSET_STATUS_COLOR[asset.status]}
              />
              {prospect.assets.length > 1 && (
                <button
                  className="b-del"
                  title="Delete this account"
                  onClick={() => {
                    if (confirm('Delete this account?')) onDeleteAsset(asset.id)
                  }}
                  style={{ alignSelf: 'center' }}
                >
                  ×
                </button>
              )}
            </FieldRow>
          ))}
          <button className="b-plus" style={{ marginBottom: 14 }} onClick={onAddAsset}>
            + Add account
          </button>

          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' }}>
            Stage &amp; next step
          </div>
          <FieldRow last>
            <BoxSelect
              label="Stage"
              width={130}
              value={prospect.stage}
              options={settings.stages.map((s) => ({ value: s.key, label: s.formLabel }))}
              onCommit={onChangeStage}
              color={stageDef.color}
            />
            <TypeaheadSelect
              label="Assigned To"
              width={140}
              value={prospect.assignedTo}
              options={listOpts(settings.teamMembers)}
              onCommit={(v) => {
                onChange({ assignedTo: v })
                onAddListValue('teamMembers', v)
              }}
              placeholder="Type a name…"
            />
            <TypeaheadSelect
              label="Next Step"
              grow
              value={prospect.nextStep}
              options={listOpts(settings.nextStepSuggestions[prospect.stage] ?? [])}
              onCommit={(v) => {
                onChange({ nextStep: v })
                onAddNextStepSuggestion(prospect.stage, v)
              }}
              placeholder="Choose a suggestion or type your own…"
            />
            <BoxSelect
              label="Next Step Status"
              width={130}
              value={prospect.nextStepStatus}
              options={opts(NEXT_STEP_STATUSES, NEXT_STEP_STATUS_LABELS)}
              onCommit={(v) => onChange({ nextStepStatus: v })}
            />
            <BoxText label="Next Step Due" type="date" width={140} value={prospect.nextStepOn} onCommit={(v) => onChange({ nextStepOn: v })} />
          </FieldRow>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${BORDER}` }}>
        <ActionBtn
          label="Delete opportunity"
          color={DANGER}
          onClick={() => {
            if (confirm(`Delete ${prospect.name || 'this opportunity'} and everything on it?`)) onDelete()
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {onNext && <ActionBtn label="Next" color={FG} onClick={onNext} />}
          <ActionBtn label="Duplicate" color={FG} onClick={onDuplicate} />
          <ActionBtn label="Save" color={SUCCESS} onClick={onClose} />
        </div>
      </div>
    </Modal>
  )
}
