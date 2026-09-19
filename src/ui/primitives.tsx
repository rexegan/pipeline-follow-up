import { useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { BORDER, CARD, FG, MUTED, MUTED_BG, NO_PASSWORD_MANAGER, SANS, SUCCESS } from './theme'
import { fmtMoney, parseMoney } from '../lib/dates'
import { formatPhone } from '../lib/phone'

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

/** A phone field that formats itself as (817) 555-0142 while you type. */
export function BoxPhone({
  label,
  value,
  onCommit,
  width,
}: {
  label: string
  value: string
  onCommit: (value: string) => void
  width?: number
}) {
  return (
    <FieldShell label={label} width={width}>
      <input
        type="tel"
        aria-label={label}
        value={value}
        placeholder="(555) 555-0100"
        onChange={(e) => onCommit(formatPhone(e.target.value))}
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
  grow,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onCommit: (value: T) => void
  color?: string
  width?: number
  grow?: boolean
}) {
  return (
    <FieldShell label={label} width={width} grow={grow}>
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

/**
 * A searchable "who is this about" field — type any part of a name to filter
 * a live dropdown, rather than scrolling a plain <select> of everyone in the
 * practice. Matches anywhere in the label (not just the start), so "davis"
 * finds "Davis, Robert" as readily as "Robert Davis".
 */
export function Combobox({
  label,
  value,
  options,
  onCommit,
  placeholder = 'Type a name…',
  width,
  grow,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onCommit: (value: string) => void
  placeholder?: string
  width?: number
  grow?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  return (
    <FieldShell label={label} width={width} grow={grow}>
      <div style={{ position: 'relative' }}>
        <input
          aria-label={label}
          value={open ? query : (selected?.label ?? '')}
          placeholder={placeholder}
          onFocus={() => {
            setQuery('')
            setOpen(true)
          }}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') e.currentTarget.blur()
            if (e.key === 'Enter' && filtered.length > 0) {
              onCommit(filtered[0].value)
              e.currentTarget.blur()
            }
          }}
          className="box-input"
          style={BOX_INPUT}
          {...NO_PASSWORD_MANAGER}
        />
        {open && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 20,
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              marginTop: 2,
              maxHeight: 190,
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <div
              onMouseDown={(e) => {
                e.preventDefault()
                onCommit('')
                setOpen(false)
              }}
              style={{ padding: '6px 10px', fontSize: 13, color: MUTED, cursor: 'pointer' }}
            >
              — Not tied to anyone —
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: '6px 10px', fontSize: 13, color: MUTED }}>No matches</div>
            )}
            {filtered.map((o) => (
              <div
                key={o.value}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onCommit(o.value)
                  setOpen(false)
                }}
                className="combo-option"
                style={{ padding: '6px 10px', fontSize: 13, color: FG, cursor: 'pointer' }}
              >
                {o.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </FieldShell>
  )
}

/**
 * A dropdown you can also type into. Filters the option list live like
 * `Combobox`, but — unlike it — isn't backed by a fixed set of IDs: leaving
 * text that doesn't match any option commits that text as-is on blur/Enter.
 * Used where a list of good suggestions helps but shouldn't be the only
 * allowed answer (a custodian that isn't in Settings' list yet, a next step
 * that isn't one of the canned suggestions).
 */
export function TypeaheadSelect({
  label,
  value,
  options,
  onCommit,
  placeholder = 'Type or choose…',
  width,
  grow,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onCommit: (value: string) => void
  placeholder?: string
  width?: number
  grow?: boolean
}) {
  const [query, setQuery] = useState<string | null>(null)
  const cancelledRef = useRef(false)
  const editing = query !== null
  const shown = editing ? query : (options.find((o) => o.value === value)?.label ?? value)
  const filtered = editing && query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  function commit(raw: string) {
    const text = raw.trim()
    // Leaving it blank on blur/Enter cancels rather than clears — opening the
    // dropdown to look and clicking away shouldn't wipe an existing value.
    if (!text) return
    const match = options.find((o) => o.label.toLowerCase() === text.toLowerCase())
    onCommit(match ? match.value : text)
  }

  return (
    <FieldShell label={label} width={width} grow={grow}>
      <div style={{ position: 'relative' }}>
        <input
          aria-label={label}
          value={shown}
          placeholder={placeholder}
          onFocus={() => setQuery('')}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => {
            if (!cancelledRef.current) commit(query ?? '')
            cancelledRef.current = false
            setQuery(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              cancelledRef.current = true
              e.currentTarget.blur()
            }
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          className="box-input"
          style={BOX_INPUT}
          {...NO_PASSWORD_MANAGER}
        />
        {editing && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 20,
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              marginTop: 2,
              maxHeight: 190,
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {filtered.length === 0 && (
              <div style={{ padding: '6px 10px', fontSize: 13, color: MUTED }}>
                {'No matches — keep typing to use your own'}
              </div>
            )}
            {filtered.map((o) => (
              <div
                key={o.value}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onCommit(o.value)
                  setQuery(null)
                }}
                className="combo-option"
                style={{ padding: '6px 10px', fontSize: 13, color: FG, cursor: 'pointer' }}
              >
                {o.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </FieldShell>
  )
}

/** A read-only value — same boxed-field look as everything else, but
 *  non-editable and highlighted green when `done` (e.g. a frozen clock). */
export function ReadOnlyBox({ label, value, width, done }: { label: string; value: string; width?: number; done?: boolean }) {
  return (
    <FieldShell label={label} width={width}>
      <div
        style={{
          ...BOX_INPUT,
          display: 'flex',
          alignItems: 'center',
          background: MUTED_BG,
          color: done ? SUCCESS : FG,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
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
  onDelete?: () => void
  deleteTitle?: string
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
        padding: onDelete ? '10px 34px 10px 12px' : '10px 12px',
        marginBottom: 8,
      }}
    >
      {children}
      {onDelete && (
        <button
          className="b-del"
          title={deleteTitle}
          onClick={onDelete}
          style={{ position: 'absolute', top: 8, right: 8 }}
        >
          ×
        </button>
      )}
    </div>
  )
}

/** Full-screen overlay with a centered panel — the opportunity detail view. */
export function Modal({ onClose, children, width = 720 }: { onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9,9,11,0.4)',
        display: 'flex',
        // Stretch (not flex-start) so the panel fills the full height between
        // the top and bottom padding — the same gray margin on both edges,
        // instead of shrink-to-fit leaving a lopsided gap at the bottom.
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: CARD,
          borderRadius: 10,
          border: `1px solid ${BORDER}`,
          width: '100%',
          maxWidth: width,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function ActionBtn({
  label,
  onClick,
  color = FG,
  small,
}: {
  label: string
  onClick: () => void
  color?: string
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: `1px solid ${color}`,
        color,
        borderRadius: 6,
        padding: small ? '4px 10px' : '7px 14px',
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: SANS,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

export function Chip({ label, color, bg, border }: { label: string; color: string; bg: string; border?: boolean }) {
  return (
    <span className="chip" style={{ background: bg, color, border: border ? `1px solid ${BORDER}` : undefined }}>
      {label}
    </span>
  )
}

export function StatCard({
  label,
  value,
  color = FG,
  onClick,
}: {
  label: string
  value: string | number
  color?: string
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'inherit',
        cursor: onClick ? 'pointer' : 'default',
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 6,
      }}
    >
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </Tag>
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
