import { useState } from 'react'
import type { DragEvent } from 'react'
import type { Prospect, SortBy, Stage, StageDef } from '../../types'
import { findStage } from '../../types'
import { BORDER, CARD, FG, MUTED, MUTED_BG } from '../../ui/theme'
import { daysSince, daysUntil, fmtMoney } from '../../lib/dates'

type Props = {
  prospects: Prospect[]
  stages: StageDef[]
  sortBy: SortBy
  onOpen: (prospect: Prospect) => void
  onChangeStage: (prospectId: string, stage: Stage) => void
  onAddProspect: () => void
  onSelectSort: (id: SortBy) => void
}

const COLUMN_WIDTH = 165

/** A compact opportunity card — the glanceable state; click opens the full
 *  record. Every card is the same fixed height (not just a minimum) so a
 *  column of them lines up regardless of name length or whether a next step
 *  is set — needed to drag-and-stack them predictably. */
function BoardCard({
  prospect,
  color,
  onOpen,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  prospect: Prospect
  color: string
  onOpen: () => void
  dragging: boolean
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
}) {
  const total = prospect.assets.reduce((s, a) => s + (a.amount ?? 0), 0)
  const overdue = (daysUntil(prospect.nextStepOn) ?? 1) < 0
  const inStage = daysSince(prospect.stageChangedAt)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 7,
        padding: '9px 10px',
        marginBottom: 8,
        cursor: 'grab',
        opacity: dragging ? 0.4 : 1,
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
        {prospect.source || ' '}
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
        {prospect.nextStep ? `${overdue ? '⚠ ' : '→ '}${prospect.nextStep}` : ' '}
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

export function PipelineBoard({ prospects, stages, sortBy, onOpen, onChangeStage, onAddProspect, onSelectSort }: Props) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<Stage | null>(null)
  const [showOffTrack, setShowOffTrack] = useState(false)

  const activeStages = stages.filter((s) => !s.offTrack)
  const offTrackStages = stages.filter((s) => s.offTrack)
  const offTrack = prospects.filter((p) => offTrackStages.some((s) => s.key === p.stage))

  const dragHandlers = (p: Prospect) => ({
    dragging: dragId === p.id,
    onDragStart: (e: DragEvent) => {
      setDragId(p.id)
      e.dataTransfer.effectAllowed = 'move'
    },
    onDragEnd: () => setDragId(null),
  })

  // Every id besides the three cross-stage sorts and 'all' is a stage key —
  // "view just this one stage" (including an off-track one the board itself
  // otherwise hides in the collapsed strip).
  if (sortBy !== 'all') {
    let flat: Prospect[]
    if (sortBy === 'amount-desc' || sortBy === 'newest' || sortBy === 'oldest') {
      const activeKeys = new Set(activeStages.map((s) => s.key))
      flat = prospects.filter((p) => activeKeys.has(p.stage))
      if (sortBy === 'amount-desc') flat = [...flat].sort((a, b) => totalOf(b) - totalOf(a))
      if (sortBy === 'newest') flat = [...flat].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      if (sortBy === 'oldest') flat = [...flat].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else {
      flat = prospects.filter((p) => p.stage === sortBy)
    }

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {flat.length === 0 ? (
          <div style={{ fontSize: 13, color: MUTED, padding: '20px 0' }}>Nothing here yet.</div>
        ) : (
          flat.map((p) => (
            <div key={p.id} style={{ width: COLUMN_WIDTH }}>
              <BoardCard prospect={p} color={findStage(stages, p.stage).color} onOpen={() => onOpen(p)} {...dragHandlers(p)} />
            </div>
          ))
        )}
      </div>
    )
  }

  const byStage = (key: string) => prospects.filter((p) => p.stage === key)

  function renderColumn(stage: StageDef, index: number) {
    const items = byStage(stage.key)
    const total = items.reduce((s, p) => s + totalOf(p), 0)
    const isDropTarget = overStage === stage.key && dragId !== null
    // The first column doubles as a shortcut back to the full board — same
    // destination, same label, as the sidebar's Total Opportunities stat.
    const isFirst = index === 0
    const headerLabel = isFirst ? 'Total Opportunities' : stage.shortLabel

    return (
      <div
        key={stage.key}
        onDragOver={(e) => {
          e.preventDefault()
          if (overStage !== stage.key) setOverStage(stage.key)
        }}
        onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
        onDrop={(e) => {
          e.preventDefault()
          setOverStage(null)
          if (dragId) onChangeStage(dragId, stage.key)
          setDragId(null)
        }}
        style={{
          flex: `0 0 ${COLUMN_WIDTH}px`,
          width: COLUMN_WIDTH,
          background: isDropTarget ? MUTED_BG : 'transparent',
          borderRadius: 8,
          transition: 'background 0.1s',
        }}
      >
        <button
          onClick={() => onSelectSort(isFirst ? 'all' : (stage.key as SortBy))}
          title={`View ${headerLabel}`}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            background: CARD,
            fontFamily: 'inherit',
            borderTop: `3px solid ${stage.color}`,
            border: `1px solid ${BORDER}`,
            borderTopWidth: 3,
            borderRadius: 7,
            padding: '8px 10px',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: FG }}>{headerLabel}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: MUTED, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {items.length} · {total > 0 ? fmtMoney(total) : '—'}
          </div>
        </button>

        <div style={{ minHeight: 40 }}>
          {items.map((p) => (
            <BoardCard key={p.id} prospect={p} color={stage.color} onOpen={() => onOpen(p)} {...dragHandlers(p)} />
          ))}
        </div>

        {isFirst && (
          <button className="b-add" style={{ borderRadius: 6, border: `1px dashed ${BORDER}`, fontSize: 12 }} onClick={onAddProspect}>
            + Add opportunity
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
        {activeStages.map(renderColumn)}
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
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                // Off-track has no single stage to drop into — dropping here
                // just cancels the drag rather than guessing where it goes.
                setDragId(null)
              }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}
            >
              {offTrack.map((p) => (
                <div key={p.id} style={{ width: COLUMN_WIDTH }}>
                  <BoardCard prospect={p} color={findStage(stages, p.stage).color} onOpen={() => onOpen(p)} {...dragHandlers(p)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
