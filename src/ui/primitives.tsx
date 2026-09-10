import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { C, FONT_HEAD } from './theme'
import { Icon } from './Icon'

const labelStyle: CSSProperties = {
  fontSize: 17,
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const inputBase: CSSProperties = {
  width: '100%',
  background: C.panel,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '8px 12px',
  color: C.text,
  fontSize: 20,
  outline: 'none',
  transition: 'border 0.15s',
}

type Option = { value: string; label: string }

type FieldProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  options?: Option[]
}

export function Field({ label, value, onChange, type = 'text', placeholder = '', options }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={labelStyle}>{label}</label>}
      {options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={inputBase}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6 }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputBase}
        />
      )}
    </div>
  )
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 17,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 20,
        background: color + '22',
        color,
        border: `1px solid ${C.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

type BtnProps = {
  label: string
  color?: string
  onClick: () => void
  small?: boolean
  title?: string
}

export function ActionBtn({ label, color = C.accent, onClick, small, title }: BtnProps) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? color : color + '22',
        color: hov ? '#fff' : color,
        border: `1px solid ${C.border}`,
        borderRadius: 7,
        padding: small ? '4px 10px' : '7px 14px',
        fontSize: small ? 18 : 19,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

export function Empty({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: C.muted }}>
      <div style={{ marginBottom: 12 }}>
        <Icon name="folder" size={48} />
      </div>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 20 }}>{label}</div>
      <div style={{ fontSize: 19 }}>{sub}</div>
    </div>
  )
}

/** White panel with a colored top rule — the standard record container. */
export function Card({
  accent = C.accent,
  children,
  style,
}: {
  accent?: string
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      className="fade-in"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 8,
        padding: '18px 18px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Sub-heading inside a section, in the workbook's banner style but quieter. */
export function SubHead({ label, color = C.accent, icon }: { label: string; color?: string; icon?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: FONT_HEAD,
        fontWeight: 700,
        fontSize: 26,
        color,
        borderBottom: `2px solid ${color}33`,
        paddingBottom: 6,
        marginBottom: 14,
      }}
    >
      {icon && <Icon name={icon} size={24} color={color} />}
      <span>{label}</span>
    </div>
  )
}

export function StatTile({
  value,
  label,
  sub,
  color,
  icon,
  onClick,
}: {
  value: string | number
  label: string
  sub: string
  color: string
  icon: string
  onClick?: () => void
}) {
  const text = String(value)
  return (
    <div
      className={onClick ? 'stat-tile' : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      title={onClick ? `Go to ${label}` : undefined}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 8,
        padding: '20px 18px',
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <Icon name={icon} size={30} color={color} />
      </div>
      <div
        style={{
          // Step the serif down as the figure gets longer so seven-figure
          // dollar amounts stay inside the tile.
          fontSize: text.length > 9 ? 30 : text.length > 7 ? 36 : 44,
          fontWeight: 800,
          color,
          lineHeight: 1.05,
          fontFamily: FONT_HEAD,
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: C.text, marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 17, color: C.muted, marginTop: 3 }}>{sub}</div>
      {onClick && <div style={{ fontSize: 18, color, marginTop: 10, fontWeight: 700 }}>Open →</div>}
    </div>
  )
}
