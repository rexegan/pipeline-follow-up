import type { Item } from '../types'
import { STAGES } from '../types'

const KEY = 'pipeline-follow-up:items:v1'

function isItem(value: unknown): value is Item {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.owner === 'string' &&
    typeof v.notes === 'string' &&
    typeof v.followUpOn === 'string' &&
    typeof v.createdAt === 'string' &&
    Array.isArray(v.touches) &&
    STAGES.includes(v.stage as never)
  )
}

export function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isItem) : []
  } catch {
    return []
  }
}

export function saveItems(items: Item[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Storage can be unavailable (private mode, quota); the app still works in-memory.
  }
}
