import { useState } from 'react'
import type { Asset, Prospect, Stage } from '../../types'
import {
  ACTIVITY_KIND_ICONS,
  ACTIVITY_KIND_LABELS,
  ACTIVITY_KINDS,
  ASSET_KINDS,
  ASSET_KIND_LABELS,
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  CUSTODIANS,
  CUSTODIAN_LABELS,
  KIND_LABELS,
  SOURCES,
  SOURCE_LABELS,
  STAGES,
  STAGE_FORM_LABELS,
  STAGE_LABELS,
} from '../../types'
import type { ActivityKind } from '../../types'
import { BORDER, CARD, DANGER, FG, MUTED, MUTED_BG, SANS } from '../../ui/theme'
import { ActionBtn, BoxMoney, BoxPhone, BoxSelect, BoxText, FieldRow, Modal, TypeaheadSelect } from '../../ui/primitives'
import { fmtMoney, fmtWhen, uid } from '../../lib/dates'
import { ASSET_STATUS_COLOR, STAGE_COLOR } from './stageColors'
import { NEXT_STEP_SUGGESTIONS } from './nextStepSuggestions'

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((v) => ({ value: v, label: labels[v] }))

type Props = {
  prospect: Prospect
  onChange: (patch: Partial<Prospect>) => void
  onChangeStage: (stage: Stage) => void
  onAssetChange: (assetId: string, patch: Partial<Asset>) => void
  onAddAsset: () => void
  onDeleteAsset: (assetId: string) => void
  onDelete: () => void
  onClose: () => void
}

export function ProspectDetail({
  prospect,
  onChange,
  onChangeStage,
  onAssetChange,
  onAddAsset,
  onDeleteAsset,
  onDelete,
  onClose,
}: Props) {
  const [activityKind, setActivityKind] = useState<ActivityKind>('call')
  const [activityText, setActivityText] = useState('')

  const total = prospect.assets.reduce((s, a) => s + (a.amount ?? 0), 0)
  const offTrack = prospect.stage === 'stalled' || prospect.stage === 'lost'

  function logActivity() {
    const text = activityText.trim()
    if (!text) return
    onChange({
      activity: [...prospect.activity, { id: uid(), kind: activityKind, text, at: new Date().toISOString() }],
    })
    setActivityText('')
  }

  const timeline = [...prospect.activity].reverse()

  return (
    <Modal onClose={onClose} width={940}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 20px 8px',
          borderBottom: `1px solid ${BORDER}`,
          borderLeft: `4px solid ${STAGE_COLOR[prospect.stage]}`,
          borderTopLeftRadius: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: FG }}>{prospect.name || 'Untitled opportunity'}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
            {STAGE_LABELS[prospect.stage]}
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

      <div style={{ display: 'flex', maxHeight: '75vh' }}>
        {/* Left: editable fields */}
        <div style={{ flex: '1 1 68%', padding: '8px 20px 16px', overflowY: 'auto', borderRight: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Prospect Intake
          </div>
          <FieldRow>
            <BoxText label="Name" width={180} value={prospect.name} placeholder="Last, First" onCommit={(v) => onChange({ name: v })} />
            <BoxSelect
              label="Type"
              width={110}
              value={prospect.kind}
              options={opts(['new-prospect', 'existing-client'] as const, KIND_LABELS)}
              onCommit={(v) => onChange({ kind: v })}
            />
            <BoxSelect
              label="From"
              width={140}
              value={prospect.source}
              options={opts(SOURCES, SOURCE_LABELS)}
              onCommit={(v) => onChange({ source: v })}
              color={prospect.source === 'dave-ramsey' ? '#6d28d9' : undefined}
            />
          </FieldRow>
          <FieldRow>
            <BoxText label="Referred By" width={160} value={prospect.referredBy} onCommit={(v) => onChange({ referredBy: v })} />
            <BoxPhone label="Phone" width={140} value={prospect.phone} onCommit={(v) => onChange({ phone: v })} />
            <BoxText label="Email" width={240} type="email" value={prospect.email} onCommit={(v) => onChange({ email: v })} />
          </FieldRow>

          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' }}>
            Accounts
          </div>
          {prospect.assets.map((asset) => (
            <FieldRow key={asset.id}>
              <BoxSelect
                label="Account Type"
                width={120}
                value={asset.kind}
                options={opts(ASSET_KINDS, ASSET_KIND_LABELS)}
                onCommit={(v) => onAssetChange(asset.id, { kind: v })}
              />
              <BoxMoney label="Amount" width={95} value={asset.amount} onCommit={(v) => onAssetChange(asset.id, { amount: v })} />
              <BoxSelect
                label="Where It's At Now"
                grow
                value={asset.heldAt}
                options={[{ value: '', label: '—' }, ...opts(CUSTODIANS, CUSTODIAN_LABELS)]}
                onCommit={(v) => onAssetChange(asset.id, { heldAt: v })}
              />
              <TypeaheadSelect
                label="Where It's Moving"
                grow
                value={asset.movingTo}
                options={opts(CUSTODIANS, CUSTODIAN_LABELS)}
                onCommit={(v) => onAssetChange(asset.id, { movingTo: v })}
                placeholder="Type a firm…"
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
              options={opts(STAGES, STAGE_FORM_LABELS)}
              onCommit={onChangeStage}
              color={STAGE_COLOR[prospect.stage]}
            />
            <TypeaheadSelect
              label="Next Step"
              grow
              value={prospect.nextStep}
              options={NEXT_STEP_SUGGESTIONS[prospect.stage].map((s) => ({ value: s, label: s }))}
              onCommit={(v) => onChange({ nextStep: v })}
              placeholder="Choose a suggestion or type your own…"
            />
            <BoxText label="Next Step Due" type="date" width={140} value={prospect.nextStepOn} onCommit={(v) => onChange({ nextStepOn: v })} />
          </FieldRow>
        </div>

        {/* Right: activity timeline */}
        <div style={{ flex: '1 1 32%', padding: '8px 20px 16px', overflowY: 'auto', background: MUTED_BG }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Activity
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <select
              aria-label="Activity type"
              value={activityKind}
              onChange={(e) => setActivityKind(e.target.value as ActivityKind)}
              style={{ border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13, fontFamily: SANS, background: CARD, padding: '0 6px', height: 32 }}
            >
              {ACTIVITY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {ACTIVITY_KIND_ICONS[k]} {ACTIVITY_KIND_LABELS[k]}
                </option>
              ))}
            </select>
            <input
              aria-label="Log an activity"
              value={activityText}
              onChange={(e) => setActivityText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && logActivity()}
              placeholder="What happened…"
              style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13, fontFamily: SANS, background: CARD, padding: '0 8px', height: 32 }}
            />
            <ActionBtn label="Log" small onClick={logActivity} />
          </div>

          {timeline.length === 0 ? (
            <div style={{ fontSize: 13, color: MUTED, padding: '12px 0' }}>Nothing logged yet.</div>
          ) : (
            timeline.map((entry) => (
              <div key={entry.id} style={{ display: 'flex', gap: 8, padding: '8px 0', borderTop: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{ACTIVITY_KIND_ICONS[entry.kind]}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: FG, lineHeight: 1.4 }}>{entry.text}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {ACTIVITY_KIND_LABELS[entry.kind]} · {fmtWhen(entry.at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${BORDER}` }}>
        <ActionBtn
          label="Delete opportunity"
          color={DANGER}
          onClick={() => {
            if (confirm(`Delete ${prospect.name || 'this opportunity'} and everything on it?`)) onDelete()
          }}
        />
        <ActionBtn label="Close" color={MUTED} onClick={onClose} />
      </div>
    </Modal>
  )
}
