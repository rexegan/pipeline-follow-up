import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { BORDER, CARD, FG, MUTED, NO_PASSWORD_MANAGER, SANS } from './theme'
import { fmtMoney, parseMoney } from '../lib/dates'

/**
 * Boxed field variants for the stacked record-card layout: a bordered box
 * with its own small label. Used so a record's fields wrap onto a fixed
 * number of lines instead of one row extending arbitrarily wide.
 */
const BOX_INPUT: CSSProperties = {
  width: '100%',
  height: 30,
  padding: '0 8px',
  fontSize: 13,
  fontFamily: SANS,
  color: FG,
  background: '#fff',
  border: `1px solid ${BORDER}`,
  borderRadius: 6,
  outline: 'none',
  boxSizing: 'border-box',
}

function FieldShell({ label, width, grow, children }: { label: string; width?: number; grow?: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minWidth: width ? Math.min(width, 100) : 100,
        flex: grow ? '1 1 200px' : width ? `0 1 ${width}px` : '1 1 120px',
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

export function BoxText({
  label,
  value,
  onCommit,
  type = 'text',
  placeholder,
  width,
  grow,
}: {
  label: string
  value: string
  onCommit: (value: string) => void
  type?: 'text' | 'date' | 'email'
  placeholder?: string
  width?: number
  grow?: boolean
}) {
  return (
    <FieldShell label={label} width={width} grow={grow}>
      <input
        type={type}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onCommit(e.target.value)}
        className="box-input"
        style={BOX_INPUT}
        {...NO_PASSWORD_MANAGER}
      />
    </FieldShell>
  )
}

export function BoxSelect<T extends string>({
  label,
  value,
  options,
  onCommit,
  color,
  width,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onCommit: (value: T) => void
  color?: string
  width?: number
}) {
  return (
    <FieldShell label={label} width={width}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onCommit(e.target.value as T)}
        className="box-input"
        style={{ ...BOX_INPUT, cursor: 'pointer', color: color ?? FG, fontWeight: color ? 600 : 400 }}
        {...NO_PASSWORD_MANAGER}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label || '—'}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

export function BoxMoney({
  label,
  value,
  onCommit,
  width,
}: {
  label: string
  value: number | null
  onCommit: (value: number | null) => void
  width?: number
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <FieldShell label={label} width={width}>
      <input
        aria-label={label}
        value={focused ? draft : value === null ? '' : fmtMoney(value)}
        placeholder="—"
        onFocus={() => {
          setDraft(value === null ? '' : String(value))
          setFocused(true)
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setFocused(false)
          onCommit(parseMoney(draft))
        }}
        className="box-input"
        style={{ ...BOX_INPUT, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
        {...NO_PASSWORD_MANAGER}
      />
    </FieldShell>
  )
}

/** One line of fields within a record card. */
export function FieldRow({ children, last }: { children: ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8, marginBottom: last ? 0 : 8 }}>
      {children}
    </div>
  )
}

/**
 * A record — one prospect, one follow-up — as a bordered card of stacked
 * field rows instead of one very wide table row. Keeps everything visible
 * without horizontal scrolling no matter how many fields a record grows to;
 * more fields mean a taller card, not a wider table.
 */
export function RecordCard({
  accent,
  onDelete,
  deleteTitle,
  children,
}: {
  accent: string
  onDelete: () => void
  deleteTitle: string
  children: ReactNode
}) {
  return (
    <div
      className="record-card"
      style={{
        position: 'relative',
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 8,
        padding: '10px 34px 10px 12px',
        marginBottom: 8,
      }}
    >
      {children}
      <button
        className="b-del"
        title={deleteTitle}
        onClick={onDelete}
        style={{ position: 'absolute', top: 8, right: 8 }}
      >
        ×
      </button>
    </div>
  )
}

export function Chip({ label, color, bg, border }: { label: string; color: string; bg: string; border?: boolean }) {
  return (
    <span className="chip" style={{ background: bg, color, border: border ? `1px solid ${BORDER}` : undefined }}>
      {label}
    </span>
  )
}

export function StatCard({ label, value, color = FG }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

export function SideLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: MUTED,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        padding: '0 4px',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}
