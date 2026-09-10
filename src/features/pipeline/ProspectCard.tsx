import type { Prospect } from '../../types'
import {
  ASSET_KIND_LABELS,
  ASSET_STATUS_LABELS,
  KIND_LABELS,
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
} from '../../types'
import { C, FONT_HEAD } from '../../ui/theme'
import { Icon } from '../../ui/Icon'
import { ActionBtn, Badge, Card } from '../../ui/primitives'
import { daysUntil, fmtDate, fmtMoney } from '../../lib/dates'
import { ASSET_STATUS_COLORS, STAGE_COLORS } from './stageColors'

type Props = {
  prospect: Prospect
  onChange: (id: string, patch: Partial<Prospect>) => void
  onEdit: (prospect: Prospect) => void
  onDelete: (id: string) => void
  onAddFollowUp: (prospect: Prospect) => void
}

export function ProspectCard({ prospect, onChange, onEdit, onDelete, onAddFollowUp }: Props) {
  const stageColor = STAGE_COLORS[prospect.stage]
  const total = prospect.assets.reduce((sum, a) => sum + (a.amount ?? 0), 0)
  const overdue = (daysUntil(prospect.nextStepOn) ?? 1) < 0

  return (
    <Card accent={stageColor} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.15 }}>
            {prospect.name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <Badge label={KIND_LABELS[prospect.kind]} color={prospect.kind === 'existing-client' ? C.teal : C.accent} />
            <Badge label={SOURCE_LABELS[prospect.source]} color={prospect.source === 'dave-ramsey' ? C.bannerRust : C.muted} />
            {prospect.referredBy && (
              <span style={{ fontSize: 18, color: C.muted }}>
                <Icon name="user" size={17} /> {prospect.referredBy}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 32, fontWeight: 800, color: stageColor, lineHeight: 1 }}>
            {fmtMoney(total)}
          </div>
          <div style={{ fontSize: 17, color: C.muted, marginTop: 3 }}>
            {prospect.assets.length} account{prospect.assets.length === 1 ? '' : 's'} identified
          </div>
        </div>
      </div>

      {(prospect.phone || prospect.email) && (
        <div style={{ display: 'flex', gap: 18, fontSize: 18, color: C.muted, marginBottom: 12 }}>
          {prospect.phone && (
            <span>
              <Icon name="phone" size={17} /> {prospect.phone}
            </span>
          )}
          {prospect.email && (
            <span>
              <Icon name="mail" size={17} /> {prospect.email}
            </span>
          )}
        </div>
      )}

      {prospect.assets.length > 0 && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 120px 1fr 1fr 130px',
              gap: 10,
              padding: '7px 12px',
              background: C.labelFill,
              fontSize: 16,
              fontWeight: 700,
              color: C.text,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span>Account</span>
            <span>Amount</span>
            <span>Where it's at</span>
            <span>Where it goes</span>
            <span>Status</span>
          </div>
          {prospect.assets.map((asset) => (
            <div
              key={asset.id}
              className="row-hover"
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 120px 1fr 1fr 130px',
                gap: 10,
                padding: '8px 12px',
                fontSize: 19,
                borderTop: `1px solid ${C.border}`,
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 600 }}>{ASSET_KIND_LABELS[asset.kind]}</span>
              <span>{fmtMoney(asset.amount)}</span>
              <span style={{ color: asset.heldAt ? C.text : C.muted }}>{asset.heldAt || '—'}</span>
              <span style={{ color: asset.movingTo ? C.text : C.muted }}>{asset.movingTo || '—'}</span>
              <span>
                <Badge label={ASSET_STATUS_LABELS[asset.status]} color={ASSET_STATUS_COLORS[asset.status]} />
              </span>
            </div>
          ))}
        </div>
      )}

      {prospect.notes && (
        <p style={{ fontSize: 19, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>{prospect.notes}</p>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          background: overdue ? C.orange + '15' : C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <Icon name={overdue ? 'alert' : 'target'} size={20} color={overdue ? C.orange : C.accent} />
        <span style={{ fontSize: 19, fontWeight: 600 }}>{prospect.nextStep || 'No next step set'}</span>
        {prospect.nextStepOn && (
          <span style={{ fontSize: 18, color: overdue ? C.orange : C.muted, fontWeight: overdue ? 700 : 400 }}>
            {fmtDate(prospect.nextStepOn)}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <select
          aria-label={`Stage for ${prospect.name}`}
          value={prospect.stage}
          onChange={(e) => onChange(prospect.id, { stage: e.target.value as Prospect['stage'], updatedAt: new Date().toISOString() })}
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: '6px 10px',
            fontSize: 19,
            fontWeight: 600,
            color: stageColor,
            outline: 'none',
          }}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <ActionBtn label="Edit" small onClick={() => onEdit(prospect)} />
        <ActionBtn label="+ Follow-up" color={C.bannerRust} small onClick={() => onAddFollowUp(prospect)} />
        <ActionBtn label="Delete" color={C.red} small onClick={() => onDelete(prospect.id)} />
      </div>
    </Card>
  )
}
