import { useState } from 'react'
import type { CSSProperties } from 'react'
import { BORDER, CARD, FG, MUTED, NO_PASSWORD_MANAGER, SANS } from './theme'
import { fmtMoney, parseMoney } from '../lib/dates'

/** Borderless input that fills its table cell, as in the blotter. */
const CELL_INPUT: CSSProperties = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  width: '100%',
  height: '100%',
  padding: '0 10px',
  fontSize: 13,
  fontWeight: 400,
  color: FG,
  fontFamily: SANS,
  boxSizing: 'border-box',
}

export function TextCell({
  value,
  onCommit,
  type = 'text',
  placeholder,
  label,
}: {
  value: string
  onCommit: (value: string) => void
  type?: 'text' | 'date' | 'email'
  placeholder?: string
  label: string
}) {
  return (
    <input
      type={type}
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onCommit(e.target.value)}
      className="b-input"
      style={CELL_INPUT}
      {...NO_PASSWORD_MANAGER}
    />
  )
}

export function SelectCell<T extends string>({
  value,
  options,
  onCommit,
  label,
  color,
}: {
  value: T
  options: { value: T; label: string }[]
  onCommit: (value: T) => void
  label: string
  color?: string
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onCommit(e.target.value as T)}
      className="b-input"
      style={{ ...CELL_INPUT, cursor: 'pointer', appearance: 'none', color: color ?? FG, fontWeight: color ? 500 : 400 }}
      {...NO_PASSWORD_MANAGER}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label || '—'}
        </option>
      ))}
    </select>
  )
}

/**
 * Dollar cell: raw digits while focused so typing behaves, formatted when not.
 * Local state avoids fighting the caret on every keystroke.
 */
export function MoneyCell({
  value,
  onCommit,
  label,
}: {
  value: number | null
  onCommit: (value: number | null) => void
  label: string
}) {
  // `draft` only matters while focused — it is seeded on focus and read back on
  // blur — so there is nothing to synchronise when the value changes elsewhere.
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  return (
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
      className="b-input"
      style={{ ...CELL_INPUT, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
      {...NO_PASSWORD_MANAGER}
    />
  )
}

export function Chip({ label, color, bg, border }: { label: string; color: string; bg: string; border?: boolean }) {
  return (
    <span className="chip" style={{ background: bg, color, border: border ? `1px solid ${BORDER}` : undefined }}>
      {label}
    </span>
  )
}

export type SummaryItem = { label: string; value: string | number; color?: string }

/**
 * Tight horizontal stat row, as in the blotter's own summary bar: each figure
 * sits in its own cell divided by a hairline, not a card of its own — the
 * point is a single dense strip, not a row of boxes.
 */
export function SummaryStrip({ items }: { items: SummaryItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
        width: 'fit-content',
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          style={{
            padding: '8px 18px',
            borderLeft: i === 0 ? undefined : `1px solid ${BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 108,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {item.label}
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: item.color ?? FG, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {item.value}
          </span>
        </div>
      ))}
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

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: '40px 16px', textAlign: 'center', color: MUTED, fontSize: 13, background: CARD }}>
        {message}
      </td>
    </tr>
  )
}
