import type { Prospect, SortBy, StageDef } from '../../types'
import { findStage } from '../../types'
import { BORDER, CARD, FG, MUTED } from '../../ui/theme'
import { daysSince, daysUntil, fmtMoney } from '../../lib/dates'
import { useState } from 'react'

type Props = {
  prospects: Prospect[]
  stages: StageDef[]
  sortBy: SortBy
  onOpen: (prospect: Prospect) => void
  onAddProspect: () => void
}

const COLUMN_WIDTH = 165
// Every view — "All Opportunities" and every Sort/filter option — lays out
// as a strict grid of this many per row, left to right, then wrapping to a
// new row, rather than a width-dependent flex-wrap or a horizontal scroll.
const GRID_COLUMNS = 7
const gridStyle = { display: 'grid', gridTemplateColumns: `repeat(${GRID_COLUMNS}, ${COLUMN_WIDTH}px)`, gap: 12 } as const

/** A compact opportunity card — the glanceable state; click opens the full
 *  record. Every card is the same fixed height (not just a minimum) so a row
 *  of them lines up regardless of name length or whether a next step is set. */
function BoardCard({ prospect, color, onOpen }: { prospect: Prospect; color: string; onOpen: () => void }) {
  const total = prospect.assets.reduce((s, a) => s + (a.amount ?? 0), 0)
  const overdue = (daysUntil(prospect.nextStepOn) ?? 1) < 0
  const inStage = daysSince(prospect.stageChangedAt)

  return (
    <div
      onClick={onOpen}
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 7,
        padding: '9px 10px',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        height: 122,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'flex-start', height: 36 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: FG,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {prospect.name || 'Untitled'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: FG, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {fmtMoney(total)}
        </div>
      </div>

      <div style={{ fontSize: 11, color: MUTED, marginTop: 3, height: 14, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {prospect.source || ' '}
      </div>

      <div
        style={{
          fontSize: 12,
          color: overdue ? '#b91c1c' : MUTED,
          fontWeight: overdue ? 600 : 400,
          marginTop: 6,
          height: 16,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={prospect.nextStep}
      >
        {prospect.nextStep ? `${overdue ? '⚠ ' : '→ '}${prospect.nextStep}` : ' '}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{ fontSize: 10, color: '#a1a1aa' }}>{inStage === 0 ? 'New today' : `${inStage}d in stage`}</span>
        {prospect.activity.length > 0 && <span style={{ fontSize: 10, color: '#a1a1aa' }}>{prospect.activity.length} logged</span>}
      </div>
    </div>
  )
}

function totalOf(p: Prospect): number {
  return p.assets.reduce((s, a) => s + (a.amount ?? 0), 0)
}

/**
 * Every opportunity flows left to right, seven per row, then wraps —
 * one unified grid rather than a column per stage. Stage is still visible
 * per card (the colored left border); change it from the record's own Stage
 * field, not by dragging between columns. Off-track opportunities (Stalled,
 * Lost) stay out of this grid entirely, tucked into their own strip below.
 */
export function PipelineBoard({ prospects, stages, sortBy, onOpen, onAddProspect }: Props) {
  const [showOffTrack, setShowOffTrack] = useState(false)

  const activeStages = stages.filter((s) => !s.offTrack)
  const offTrackStages = stages.filter((s) => s.offTrack)
  const offTrack = prospects.filter((p) => offTrackStages.some((s) => s.key === p.stage))
  const activeKeys = new Set(activeStages.map((s) => s.key))

  // 'all' and the three cross-stage sorts all draw from every active
  // opportunity; anything else is a specific stage key (including an
  // off-track one, surfacing it outside the collapsed strip on request).
  let flat: Prospect[]
  if (sortBy === 'all' || sortBy === 'amount-desc' || sortBy === 'newest' || sortBy === 'oldest') {
    flat = prospects.filter((p) => activeKeys.has(p.stage))
    if (sortBy === 'amount-desc') flat = [...flat].sort((a, b) => totalOf(b) - totalOf(a))
    if (sortBy === 'newest') flat = [...flat].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (sortBy === 'oldest') flat = [...flat].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else {
    flat = prospects.filter((p) => p.stage === sortBy)
  }

  return (
    <div>
      <button className="b-plus" style={{ marginBottom: 10 }} onClick={onAddProspect}>
        + Add opportunity
      </button>

      <div style={gridStyle}>
        {flat.length === 0 ? (
          <div style={{ fontSize: 13, color: MUTED, padding: '20px 0', gridColumn: `span ${GRID_COLUMNS}` }}>Nothing here yet.</div>
        ) : (
          flat.map((p) => (
            <BoardCard key={p.id} prospect={p} color={findStage(stages, p.stage).color} onOpen={() => onOpen(p)} />
          ))
        )}
      </div>

      {offTrack.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => setShowOffTrack((s) => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: MUTED, fontWeight: 600, padding: 0 }}
          >
            {showOffTrack ? '▾' : '▸'} {offTrack.length} stalled or lost
          </button>
          {showOffTrack && (
            <div style={{ ...gridStyle, marginTop: 8 }}>
              {offTrack.map((p) => (
                <BoardCard key={p.id} prospect={p} color={findStage(stages, p.stage).color} onOpen={() => onOpen(p)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
