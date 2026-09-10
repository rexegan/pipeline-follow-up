import type { FollowUp, Prospect } from '../types'
import { STAGES, HORIZONS } from '../types'

/**
 * Every read and write is async so the localStorage implementation can be
 * swapped for an HTTP-backed one without touching call sites. Team access on
 * multiple devices needs that server; this keeps the seam in one file.
 */
export interface Repository {
  loadProspects(): Promise<Prospect[]>
  saveProspects(prospects: Prospect[]): Promise<void>
  loadFollowUps(): Promise<FollowUp[]>
  saveFollowUps(followUps: FollowUp[]): Promise<void>
}

const PROSPECTS_KEY = 'pipeline-follow-up:prospects:v1'
const FOLLOWUPS_KEY = 'pipeline-follow-up:followups:v1'

function isProspect(value: unknown): value is Prospect {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.name === 'string' && STAGES.includes(v.stage as never)
}

function isFollowUp(value: unknown): value is FollowUp {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.title === 'string' && HORIZONS.includes(v.horizon as never)
}

function read<T>(key: string, guard: (value: unknown) => value is T): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(guard) : []
  } catch {
    return []
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, quota); the app still works in-memory.
  }
}

export const localRepository: Repository = {
  async loadProspects() {
    return read(PROSPECTS_KEY, isProspect)
  },
  async saveProspects(prospects) {
    write(PROSPECTS_KEY, prospects)
  },
  async loadFollowUps() {
    return read(FOLLOWUPS_KEY, isFollowUp)
  },
  async saveFollowUps(followUps) {
    write(FOLLOWUPS_KEY, followUps)
  },
}
