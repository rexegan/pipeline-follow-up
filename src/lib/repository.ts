import type { FollowUp, Prospect, Settings } from '../types'
import { DEFAULT_SETTINGS, HORIZONS } from '../types'
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
  loadSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>
  /** Whether this browser has ever had data written to it — gates the
   *  one-time demo seed so deleting everything later doesn't bring it back. */
  hasSeeded(): Promise<boolean>
  markSeeded(): Promise<void>
}

const PROSPECTS_KEY = 'pipeline-follow-up:prospects:v1'
const FOLLOWUPS_KEY = 'pipeline-follow-up:followups:v1'
const SETTINGS_KEY = 'pipeline-follow-up:settings:v1'
const SEEDED_KEY = 'pipeline-follow-up:seeded:v1'

/**
 * Stage/source/account-type/custodian used to be fixed slug-coded enums
 * ('401k', 'edward-jones', 'dave-ramsey'…) with a separate label table for
 * display. Now that they're free, user-editable strings (see Settings), the
 * value itself is what's shown — so a record saved under the old scheme
 * would otherwise display its slug literally. Backfilled on load only; new
 * data never needs this.
 */
const LEGACY_ASSET_KIND_LABELS: Record<string, string> = {
  '401k': '401(k)',
  '403b': '403(b)',
  ira: 'Traditional IRA',
  'roth-ira': 'Roth IRA',
  brokerage: 'Brokerage',
  annuity: 'Annuity',
  pension: 'Pension',
  cash: 'Cash / CD',
  'life-insurance': 'Life insurance',
  other: 'Other',
}

const LEGACY_CUSTODIAN_LABELS: Record<string, string> = {
  fidelity: 'Fidelity',
  vanguard: 'Vanguard',
  'charles-schwab': 'Charles Schwab',
  empower: 'Empower',
  'edward-jones': 'Edward Jones',
  'lpl-financial': 'LPL Financial',
  'merrill-lynch': 'Merrill Lynch',
  'morgan-stanley': 'Morgan Stanley',
  ameriprise: 'Ameriprise',
  'raymond-james': 'Raymond James',
  'wells-fargo-advisors': 'Wells Fargo Advisors',
  't-rowe-price': 'T. Rowe Price',
  tiaa: 'TIAA',
  voya: 'Voya',
  principal: 'Principal',
  'john-hancock': 'John Hancock',
  nationwide: 'Nationwide',
  prudential: 'Prudential',
  'mass-mutual': 'MassMutual',
  'new-york-life': 'New York Life',
  'american-funds': 'American Funds',
  'lincoln-financial': 'Lincoln Financial',
  'pacific-life': 'Pacific Life',
  allianz: 'Allianz',
  ubs: 'UBS',
  'td-ameritrade': 'TD Ameritrade',
  other: 'Other',
}

const LEGACY_SOURCE_LABELS: Record<string, string> = {
  'dave-ramsey': 'Dave Ramsey',
  'client-referral': 'Client referral',
  coi: 'Center of influence',
  'existing-client': 'Existing client',
  seminar: 'Seminar / event',
  'walk-in': 'Walk-in / inbound',
  other: 'Other',
}

function isProspect(value: unknown): value is Prospect {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.name === 'string' && typeof v.stage === 'string'
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
    nextStepStatus: p.nextStepStatus ?? 'in-process',
    // Formatting only ever ran on typing, so a number saved before that
    // shipped (or entered any other way) would sit there unformatted forever.
    phone: formatPhone(p.phone),
    source: LEGACY_SOURCE_LABELS[p.source] ?? p.source,
    assets: p.assets.map((a) => ({
      ...a,
      kind: LEGACY_ASSET_KIND_LABELS[a.kind] ?? a.kind,
      heldAt: LEGACY_CUSTODIAN_LABELS[a.heldAt] ?? a.heldAt,
      movingTo: LEGACY_CUSTODIAN_LABELS[a.movingTo] ?? a.movingTo,
    })),
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

/** Backfills any settings category missing from a browser's saved settings
 *  (added after that browser last saved, or never saved at all) with its default. */
function normalizeSettings(raw: unknown): Settings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Partial<Settings> & { custodians?: string[] }
  // Where It's At Now and Where It's Moving used to share one "custodians"
  // list. A browser that saved settings before the split still has it under
  // that old key — safe to reuse for "held at" (same broad list either way),
  // but not for "moving to": the whole point of the split was narrowing that
  // one down, so falling back to the new default there instead of the old
  // shared list is what actually applies the narrowing.
  const legacyCustodians = Array.isArray(v.custodians) ? v.custodians : null
  return {
    stages: Array.isArray(v.stages) && v.stages.length > 0 ? v.stages : DEFAULT_SETTINGS.stages,
    custodiansHeldAt: Array.isArray(v.custodiansHeldAt)
      ? v.custodiansHeldAt
      : (legacyCustodians ?? DEFAULT_SETTINGS.custodiansHeldAt),
    custodiansMovingTo: Array.isArray(v.custodiansMovingTo) ? v.custodiansMovingTo : DEFAULT_SETTINGS.custodiansMovingTo,
    accountTypes: Array.isArray(v.accountTypes) ? v.accountTypes : DEFAULT_SETTINGS.accountTypes,
    sources: Array.isArray(v.sources) ? v.sources : DEFAULT_SETTINGS.sources,
    nextStepSuggestions:
      v.nextStepSuggestions && typeof v.nextStepSuggestions === 'object'
        ? v.nextStepSuggestions
        : DEFAULT_SETTINGS.nextStepSuggestions,
  }
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
  async loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      return raw ? normalizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  },
  async saveSettings(settings) {
    write(SETTINGS_KEY, settings)
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
