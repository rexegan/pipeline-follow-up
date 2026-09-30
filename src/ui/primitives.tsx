import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { BORDER, CARD, FG, MUTED, MUTED_BG, NO_PASSWORD_MANAGER, SANS, SUCCESS } from './theme'
import { fmtMoney, parseMoney } from '../lib/dates'
import { formatPhone } from '../lib/phone'

/**
 * Where an open dropdown panel should render, in viewport coordinates —
 * always below the anchor, never above ("drop down, not up"). Recalculated
 * on scroll/resize while open. A plain `position: absolute` popup would get
 * silently clipped by any scrollable ancestor (the modal's own scroll area)
 * once it grows past that ancestor's visible edge — invisible and
 * unreachable by scrolling, since an absolutely positioned box doesn't
 * contribute to the ancestor's scrollable content size. Portaling to
 * `document.body` with `position: fixed` at this rect sidesteps that
 * entirely, and the max-height below is sized to the actual remaining
 * viewport space so the full option list shows without an inner scrollbar
 * in the overwhelming majority of cases.
 */
function useDropdownPosition(open: boolean, anchorRef: RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    function update() {
      const r = anchorRef.current?.getBoundingClientRect()
      if (r) setPos({ top: r.bottom, left: r.left, width: r.width })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, anchorRef])

  return pos
}

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

function FieldShell({
  label,
  width,
  grow,
  hideLabel,
  centerLabel,
  children,
}: {
  label: string
  width?: number
  grow?: boolean
  /** Skips rendering the caption text, keeping its layout space reserved —
   *  used so a repeated row of fields (each Bridge Account after the first)
   *  doesn't re-print the same column headings every time. */
  hideLabel?: boolean
  /** Centers the caption over the field instead of the default left align —
   *  used for the account row's column headings. */
  centerLabel?: boolean
  children: ReactNode
}) {
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
      <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: centerLabel ? 'center' : 'left', visibility: hideLabel ? 'hidden' : 'visible' }}>
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
  hideLabel,
  centerLabel,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onCommit: (value: T) => void
  color?: string
  width?: number
  grow?: boolean
  hideLabel?: boolean
  centerLabel?: boolean
}) {
  return (
    <FieldShell label={label} width={width} grow={grow} hideLabel={hideLabel} centerLabel={centerLabel}>
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
  hideLabel,
  centerLabel,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onCommit: (value: string) => void
  placeholder?: string
  width?: number
  grow?: boolean
  hideLabel?: boolean
  centerLabel?: boolean
}) {
  const [query, setQuery] = useState<string | null>(null)
  const cancelledRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const editing = query !== null
  const pos = useDropdownPosition(editing, inputRef)
  const currentLabel = options.find((o) => o.value === value)?.label ?? value
  const shown = editing ? query : currentLabel
  // Until the text actually changes from what was already there, show every
  // option rather than filtering down to just what's already typed — a
  // click to reopen and browse shouldn't first require clearing the field.
  const filtered = editing && query.trim() && query !== currentLabel
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
    <FieldShell label={label} width={width} grow={grow} hideLabel={hideLabel} centerLabel={centerLabel}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          aria-label={label}
          value={shown}
          placeholder={placeholder}
          onFocus={(e) => {
            // Shows the existing value (selected, ready to type over) rather
            // than blanking it — clicking in to look, then clicking away
            // without picking or typing anything, leaves it exactly as it
            // was instead of visually appearing to wipe it first.
            setQuery(currentLabel)
            e.target.select()
          }}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => {
            if (!cancelledRef.current && query !== null && query.trim().toLowerCase() !== currentLabel.toLowerCase()) {
              commit(query)
            }
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
        {editing && pos && createPortal(
          <div
            style={{
              position: 'fixed',
              top: pos.top + 2,
              left: pos.left,
              minWidth: pos.width,
              zIndex: 1000,
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              maxHeight: `calc(100vh - ${pos.top + 2}px - 12px)`,
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
                  // preventDefault above stops the browser's default
                  // mousedown blur, so the input never actually loses focus
                  // here — without an explicit blur, clicking it again
                  // wouldn't fire a new focus event (browsers only fire one
                  // on an actual focus change), and the dropdown would stay
                  // shut until something else was clicked first to truly
                  // blur it. cancelledRef skips that blur's own commit,
                  // which would otherwise re-commit whatever stale search
                  // text was left over instead of the option just picked.
                  cancelledRef.current = true
                  onCommit(o.value)
                  setQuery(null)
                  inputRef.current?.blur()
                }}
                className="combo-option"
                style={{ padding: '6px 10px', fontSize: 13, color: FG, cursor: 'pointer' }}
              >
                {o.label}
              </div>
            ))}
          </div>,
          document.body,
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
  hideLabel,
  centerLabel,
}: {
  label: string
  value: number | null
  onCommit: (value: number | null) => void
  width?: number
  hideLabel?: boolean
  centerLabel?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <FieldShell label={label} width={width} hideLabel={hideLabel} centerLabel={centerLabel}>
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
export function FieldRow({
  children,
  last,
  marginBottom,
}: {
  children: ReactNode
  last?: boolean
  /** Overrides the default 8px gap below the row — used to tighten a
   *  repeated block of rows (each Bridge Account) without affecting every
   *  other FieldRow in the form. */
  marginBottom?: number
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8, marginBottom: marginBottom ?? (last ? 0 : 8) }}>
      {children}
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
          // Capped by `width`, but also scales down on narrower screens
          // rather than sitting at a fixed px that leaves a wide gray
          // backdrop margin on anything bigger than that cap.
          maxWidth: `min(${width}px, 96vw)`,
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

/**
 * A dropdown button that opens a checklist instead of picking one option —
 * "a box next to each one of those to click on," checking any combination
 * rather than a single choice. Closes on an outside click.
 */
export function CheckboxDropdown({
  label,
  summary,
  options,
  selected,
  onToggle,
}: {
  label: string
  summary: string
  options: readonly { id: string; label: string }[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const pos = useDropdownPosition(open, ref)

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
          fontSize: 12,
          fontFamily: SANS,
          color: MUTED,
          background: '#fff',
          padding: '3px 8px',
          cursor: 'pointer',
          maxWidth: 220,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary}</span>
        <span style={{ fontSize: 9, flexShrink: 0 }}>▾</span>
      </button>
      {open && pos && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: pos.top + 4,
            left: pos.left,
            zIndex: 1000,
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
            minWidth: Math.max(210, pos.width),
            maxHeight: `calc(100vh - ${pos.top + 4}px - 12px)`,
            overflowY: 'auto',
            padding: 4,
          }}
        >
          {options.map((o) => (
            <label
              key={o.id}
              className="combo-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                fontSize: 13,
                color: FG,
                cursor: 'pointer',
                borderRadius: 5,
              }}
            >
              <input type="checkbox" checked={selected.has(o.id)} onChange={() => onToggle(o.id)} />
              {o.label}
            </label>
          ))}
        </div>,
        document.body,
      )}
    </div>
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
