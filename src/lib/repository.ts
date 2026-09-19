import type { FollowUp, Prospect } from '../types'
import { STAGES, HORIZONS } from '../types'
import { formatPhone } from './phone'

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
  /** Whether this browser has ever had data written to it — gates the
   *  one-time demo seed so deleting everything later doesn't bring it back. */
  hasSeeded(): Promise<boolean>
  markSeeded(): Promise<void>
}

const PROSPECTS_KEY = 'pipeline-follow-up:prospects:v1'
const FOLLOWUPS_KEY = 'pipeline-follow-up:followups:v1'
const SEEDED_KEY = 'pipeline-follow-up:seeded:v1'

function isProspect(value: unknown): value is Prospect {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.name === 'string' && STAGES.includes(v.stage as never)
}

/**
 * Backfills fields added after data may already be sitting in a browser's
 * localStorage (activity log, stage-change timestamp) — without this, a
 * prospect saved before those fields existed loads with them `undefined` and
 * crashes the first time the UI reads `.activity.length`.
 */
function normalizeProspect(p: Prospect): Prospect {
  return {
    ...p,
    activity: Array.isArray(p.activity) ? p.activity : [],
    stageChangedAt: p.stageChangedAt || p.updatedAt || p.createdAt || new Date().toISOString(),
    // Formatting only ever ran on typing, so a number saved before that
    // shipped (or entered any other way) would sit there unformatted forever.
    phone: formatPhone(p.phone),
  }
}

function isFollowUp(value: unknown): value is FollowUp {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.title === 'string' && HORIZONS.includes(v.horizon as never)
}

/** Backfills `reason`, added after some browsers may already have follow-ups saved. */
function normalizeFollowUp(f: FollowUp): FollowUp {
  return { ...f, reason: f.reason ?? '' }
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
    return read(PROSPECTS_KEY, isProspect).map(normalizeProspect)
  },
  async saveProspects(prospects) {
    write(PROSPECTS_KEY, prospects)
  },
  async loadFollowUps() {
    return read(FOLLOWUPS_KEY, isFollowUp).map(normalizeFollowUp)
  },
  async saveFollowUps(followUps) {
    write(FOLLOWUPS_KEY, followUps)
  },
  async hasSeeded() {
    try {
      return localStorage.getItem(SEEDED_KEY) === 'true'
    } catch {
      return true // Can't persist a flag anyway; don't seed every load.
    }
  },
  async markSeeded() {
    try {
      localStorage.setItem(SEEDED_KEY, 'true')
    } catch {
      // Storage can be unavailable (private mode, quota); worst case it re-seeds next load.
    }
  },
}
