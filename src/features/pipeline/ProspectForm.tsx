import { useState } from 'react'
import type { Asset, Prospect } from '../../types'
import {
  ASSET_KINDS,
  ASSET_KIND_LABELS,
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  KIND_LABELS,
  REFERRAL_SOURCES,
  SOURCES,
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
} from '../../types'
import { C } from '../../ui/theme'
import { Icon } from '../../ui/Icon'
import { ActionBtn, Card, Field, SubHead } from '../../ui/primitives'
import { fmtMoney, parseMoney } from '../../lib/dates'
import { blankAsset } from './blanks'

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((v) => ({ value: v, label: labels[v] }))

type Props = {
  initial: Prospect
  onSave: (prospect: Prospect) => void
  onCancel: () => void
}

export function ProspectForm({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Prospect>(initial)
  const set = <K extends keyof Prospect>(key: K, value: Prospect[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const setAsset = (id: string, patch: Partial<Asset>) =>
    setDraft((d) => ({ ...d, assets: d.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) }))

  const total = draft.assets.reduce((sum, a) => sum + (a.amount ?? 0), 0)
  const showReferrer = REFERRAL_SOURCES.includes(draft.source)

  function save() {
    const name = draft.name.trim()
    if (!name) return
    onSave({
      ...draft,
      name,
      // Drop asset rows left completely empty rather than saving placeholders.
      assets: draft.assets.filter((a) => a.amount !== null || a.heldAt.trim() || a.movingTo.trim()),
      updatedAt: new Date().toISOString(),
    })
  }

  const inputBase = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 19,
    outline: 'none',
    padding: '7px 10px',
  } as const

  return (
    <Card accent={C.accent} style={{ marginBottom: 22 }}>
      <SubHead label={initial.name ? `Edit ${initial.name}` : 'New opportunity'} icon="briefcase" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
        <Field label="Name" value={draft.name} onChange={(v) => set('name', v)} placeholder="Household or prospect name" />
        <Field
          label="Type"
          value={draft.kind}
          onChange={(v) => set('kind', v as Prospect['kind'])}
          options={opts(['new-prospect', 'existing-client'] as const, KIND_LABELS)}
        />
        <Field
          label="Stage"
          value={draft.stage}
          onChange={(v) => set('stage', v as Prospect['stage'])}
          options={opts(STAGES, STAGE_LABELS)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <Field
          label="How we got them"
          value={draft.source}
          onChange={(v) => set('source', v as Prospect['source'])}
          options={opts(SOURCES, SOURCE_LABELS)}
        />
        <Field
          label={showReferrer ? 'Referred by' : 'Referred by (n/a)'}
          value={draft.referredBy}
          onChange={(v) => set('referredBy', v)}
          placeholder={showReferrer ? 'Who sent them' : ''}
        />
        <Field label="Phone" value={draft.phone} onChange={(v) => set('phone', v)} placeholder="(817) 555-0100" />
        <Field label="Email" type="email" value={draft.email} onChange={(v) => set('email', v)} placeholder="name@email.com" />
      </div>

      <SubHead label="What they have, and where it needs to go" color={C.bannerRust} icon="dollar" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {draft.assets.map((asset) => (
          <div key={asset.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={asset.kind}
              aria-label="Account type"
              onChange={(e) => setAsset(asset.id, { kind: e.target.value as Asset['kind'] })}
              style={{ ...inputBase, width: 165, flexShrink: 0 }}
            >
              {ASSET_KINDS.map((k) => (
                <option key={k} value={k}>
                  {ASSET_KIND_LABELS[k]}
                </option>
              ))}
            </select>
            <input
              aria-label="Amount"
              defaultValue={asset.amount === null ? '' : String(asset.amount)}
              onBlur={(e) => setAsset(asset.id, { amount: parseMoney(e.target.value) })}
              placeholder="$ amount"
              style={{ ...inputBase, width: 130, flexShrink: 0 }}
            />
            <input
              aria-label="Currently held at"
              value={asset.heldAt}
              onChange={(e) => setAsset(asset.id, { heldAt: e.target.value })}
              placeholder="Where it's at (Fidelity, employer plan…)"
              style={{ ...inputBase, flex: 1 }}
            />
            <Icon name="arrowRight" size={20} color={C.muted} />
            <input
              aria-label="Moving to"
              value={asset.movingTo}
              onChange={(e) => setAsset(asset.id, { movingTo: e.target.value })}
              placeholder="Where it needs to go"
              style={{ ...inputBase, flex: 1 }}
            />
            <select
              value={asset.status}
              aria-label="Asset status"
              onChange={(e) => setAsset(asset.id, { status: e.target.value as Asset['status'] })}
              style={{ ...inputBase, width: 130, flexShrink: 0 }}
            >
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ASSET_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              aria-label="Remove asset"
              onClick={() => setDraft((d) => ({ ...d, assets: d.assets.filter((a) => a.id !== asset.id) }))}
              style={{
                background: C.red + '22',
                border: `1px solid ${C.red}44`,
                color: C.red,
                borderRadius: 6,
                padding: '4px 9px',
                cursor: 'pointer',
                fontSize: 19,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <ActionBtn label="+ Add account" color={C.bannerRust} small onClick={() => setDraft((d) => ({ ...d, assets: [...d.assets, blankAsset()] }))} />
        <span style={{ fontSize: 19, color: C.muted }}>
          Total identified: <strong style={{ color: C.text }}>{fmtMoney(total)}</strong>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        <Field label="Next step" value={draft.nextStep} onChange={(v) => set('nextStep', v)} placeholder="Call to set the review" />
        <Field label="Next step on" type="date" value={draft.nextStepOn} onChange={(v) => set('nextStepOn', v)} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Field label="Notes" type="textarea" value={draft.notes} onChange={(v) => set('notes', v)} placeholder="Situation, goals, what was said" />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <ActionBtn label="Save opportunity" onClick={save} />
        <ActionBtn label="Cancel" color={C.muted} onClick={onCancel} />
      </div>
    </Card>
  )
}
