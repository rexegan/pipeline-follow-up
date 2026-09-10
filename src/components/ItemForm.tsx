import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ItemDraft, Stage } from '../types'
import { STAGES, STAGE_LABELS } from '../types'
import { addDays, today } from '../lib/dates'

type Props = {
  onAdd: (draft: ItemDraft) => void
}

const emptyDraft = (): ItemDraft => ({
  title: '',
  owner: '',
  notes: '',
  stage: 'new',
  followUpOn: addDays(today(), 3),
})

export function ItemForm({ onAdd }: Props) {
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft)

  function submit(event: FormEvent) {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title) return
    onAdd({ ...draft, title, owner: draft.owner.trim(), notes: draft.notes.trim() })
    setDraft(emptyDraft())
  }

  return (
    <form className="item-form" onSubmit={submit}>
      <div className="field grow">
        <label htmlFor="title">Who or what</label>
        <input
          id="title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Name of the person, lead, or thread"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="owner">Owner</label>
        <input
          id="owner"
          value={draft.owner}
          onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
          placeholder="Who follows up"
        />
      </div>

      <div className="field">
        <label htmlFor="stage">Stage</label>
        <select
          id="stage"
          value={draft.stage}
          onChange={(e) => setDraft({ ...draft, stage: e.target.value as Stage })}
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="followUpOn">Follow up on</label>
        <input
          id="followUpOn"
          type="date"
          value={draft.followUpOn}
          onChange={(e) => setDraft({ ...draft, followUpOn: e.target.value })}
        />
      </div>

      <div className="field grow">
        <label htmlFor="notes">Notes</label>
        <input
          id="notes"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Context for next time"
        />
      </div>

      <button type="submit">Add</button>
    </form>
  )
}
