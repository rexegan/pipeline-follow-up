import type { Item, Stage } from '../types'
import { STAGES, STAGE_LABELS } from '../types'
import { addDays, daysUntil, dueLabel, today } from '../lib/dates'

type Props = {
  item: Item
  onChange: (id: string, patch: Partial<Item>) => void
  onTouch: (id: string) => void
  onDelete: (id: string) => void
}

export function ItemCard({ item, onChange, onTouch, onDelete }: Props) {
  const days = daysUntil(item.followUpOn)
  const state = item.stage === 'closed' || days === null ? 'none' : days < 0 ? 'overdue' : days === 0 ? 'due' : 'later'

  return (
    <article className={`card card--${state}`}>
      <header>
        <h3>{item.title}</h3>
        {item.owner && <span className="owner">{item.owner}</span>}
      </header>

      {item.notes && <p className="notes">{item.notes}</p>}

      <p className={`due due--${state}`}>{item.stage === 'closed' ? 'Closed' : dueLabel(item.followUpOn)}</p>

      <div className="card-controls">
        <select
          aria-label={`Stage for ${item.title}`}
          value={item.stage}
          onChange={(e) => onChange(item.id, { stage: e.target.value as Stage })}
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>

        <input
          type="date"
          aria-label={`Follow-up date for ${item.title}`}
          value={item.followUpOn}
          onChange={(e) => onChange(item.id, { followUpOn: e.target.value })}
        />
      </div>

      <div className="card-actions">
        <button type="button" onClick={() => onTouch(item.id)}>
          Logged a touch
        </button>
        <button
          type="button"
          onClick={() => onChange(item.id, { followUpOn: addDays(item.followUpOn || today(), 7) })}
        >
          Snooze 1w
        </button>
        <button type="button" className="danger" onClick={() => onDelete(item.id)}>
          Delete
        </button>
      </div>

      {item.touches.length > 0 && (
        <p className="touches">
          {item.touches.length} touch{item.touches.length === 1 ? '' : 'es'} · last{' '}
          {new Date(item.touches[item.touches.length - 1]).toLocaleDateString()}
        </p>
      )}
    </article>
  )
}
