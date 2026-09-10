import { useEffect, useMemo, useState } from 'react'
import type { Item, ItemDraft, Stage } from './types'
import { STAGES, STAGE_LABELS } from './types'
import { loadItems, saveItems } from './lib/storage'
import { daysUntil, today } from './lib/dates'
import { ItemForm } from './components/ItemForm'
import { ItemCard } from './components/ItemCard'

type Filter = 'due' | 'open' | 'all'

const FILTER_LABELS: Record<Filter, string> = {
  due: 'Needs follow-up',
  open: 'Open',
  all: 'Everything',
}

function newId(): string {
  return crypto.randomUUID()
}

export default function App() {
  const [items, setItems] = useState<Item[]>(loadItems)
  const [filter, setFilter] = useState<Filter>('due')
  const [stageFilter, setStageFilter] = useState<Stage | 'any'>('any')

  useEffect(() => {
    saveItems(items)
  }, [items])

  function addItem(draft: ItemDraft) {
    setItems((prev) => [
      { ...draft, id: newId(), createdAt: new Date().toISOString(), touches: [] },
      ...prev,
    ])
  }

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function logTouch(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, touches: [...item.touches, new Date().toISOString()] } : item,
      ),
    )
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const visible = useMemo(() => {
    return items
      .filter((item) => (stageFilter === 'any' ? true : item.stage === stageFilter))
      .filter((item) => {
        if (filter === 'all') return true
        if (item.stage === 'closed') return false
        if (filter === 'open') return true
        const days = daysUntil(item.followUpOn)
        return days !== null && days <= 0
      })
      .sort((a, b) => {
        // Items without a date sink to the bottom; otherwise soonest first.
        if (!a.followUpOn) return 1
        if (!b.followUpOn) return -1
        return a.followUpOn.localeCompare(b.followUpOn)
      })
  }, [items, filter, stageFilter])

  const dueCount = items.filter((item) => {
    if (item.stage === 'closed') return false
    const days = daysUntil(item.followUpOn)
    return days !== null && days <= 0
  }).length

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Pipeline Follow-up</h1>
          <p className="subtitle">
            {dueCount > 0
              ? `${dueCount} item${dueCount === 1 ? ' needs' : 's need'} a follow-up as of ${today()}`
              : 'Nothing is overdue right now'}
          </p>
        </div>
      </header>

      <ItemForm onAdd={addItem} />

      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Filter by status">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              className={key === filter ? 'tab tab--active' : 'tab'}
              aria-pressed={key === filter}
              onClick={() => setFilter(key)}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        <label className="stage-filter">
          Stage
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as Stage | 'any')}>
            <option value="any">Any</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="empty">
          {items.length === 0
            ? 'No items yet — add the first one above.'
            : 'Nothing matches this filter.'}
        </p>
      ) : (
        <section className="grid">
          {visible.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onChange={updateItem}
              onTouch={logTouch}
              onDelete={deleteItem}
            />
          ))}
        </section>
      )}
    </div>
  )
}
