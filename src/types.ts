/* ---------- Pipeline ---------- */

/** A single stage on the board — fully editable from Settings (add, remove, mark off-track). */
export type StageDef = {
  key: string
  label: string
  /** Tight label for the board's column headers, where space is at a premium. */
  shortLabel: string
  /** Label for the Stage select in the record form, narrower than the header. */
  formLabel: string
  color: string
  /** Off-track stages collapse into a hideable strip below the board instead of a column. */
  offTrack: boolean
}

/** A stage is identified by its `StageDef.key` — see `findStage`. */
export type Stage = string

export const DEFAULT_STAGES: StageDef[] = [
  { key: 'first-meeting', label: 'First Meeting', shortLabel: '1st MTG/Call', formLabel: 'First Meeting', color: '#be185d', offTrack: false },
  { key: 'identified', label: 'Opportunity Uncovered', shortLabel: 'Uncovered', formLabel: 'OPP Uncovered', color: '#71717a', offTrack: false },
  { key: 'doc-prep', label: 'Doc Prep', shortLabel: 'Doc Prep', formLabel: 'Doc Prep', color: '#1d4ed8', offTrack: false },
  { key: 'docs-signed', label: 'Docs Signed', shortLabel: 'Signed', formLabel: 'Docs Signed', color: '#6d28d9', offTrack: false },
  // Standard back-office shorthand: paperwork came back either In Good Order
  // or Not In Good Order (missing signatures, wrong date, etc.) — two
  // different outcomes, so two separate stages rather than one combined one.
  { key: 'igo', label: 'IGO', shortLabel: 'IGO', formLabel: 'IGO', color: '#0891b2', offTrack: false },
  { key: 'nigo', label: 'NIGO', shortLabel: 'NIGO', formLabel: 'NIGO', color: '#ea580c', offTrack: false },
  { key: 'follow-up-check', label: 'Follow Up', shortLabel: 'Follow Up', formLabel: 'Follow Up', color: '#0f766e', offTrack: false },
  { key: 'funded', label: 'Funded', shortLabel: 'Funded', formLabel: 'Funded', color: '#16a34a', offTrack: false },
  { key: 'issued', label: 'Issued', shortLabel: 'Issued', formLabel: 'Issued', color: '#4d7c0f', offTrack: false },
  { key: 'stalled', label: 'Stalled', shortLabel: 'Stalled', formLabel: 'Stalled', color: '#a16207', offTrack: true },
  { key: 'lost', label: 'Lost', shortLabel: 'Lost', formLabel: 'Lost', color: '#dc2626', offTrack: true },
]

/**
 * Looks up a stage by key, falling back to a neutral stand-in for a stage
 * Settings no longer defines (renamed or deleted out from under a record
 * that's still sitting on it) rather than crashing.
 */
export function findStage(stages: StageDef[], key: string): StageDef {
  return stages.find((s) => s.key === key) ?? { key, label: key, shortLabel: key, formLabel: key, color: '#a1a1aa', offTrack: false }
}

/** Where an opportunity came from — a free, user-editable list (see Settings). */
export const DEFAULT_SOURCES = [
  'Dave Ramsey',
  'Client referral',
  'Center of influence',
  'Existing client',
  'Seminar / event',
  'Walk-in / inbound',
  'Other',
]

/**
 * What kind of event created the opportunity — distinct from the account
 * type itself (a 401(k) rollover and an IRA rollover can both be "IRA"
 * accounts by the time they land, but got here very differently). A free,
 * user-editable list (see Settings); the Pipeline page's Quick View filters
 * by it.
 */
export const DEFAULT_OPPORTUNITY_TYPES = [
  '401k',
  'IRA',
  'CD',
  'Sale of Land',
  'Sale of Real Estate',
  'Sale of Personal Residence',
  'Inheritance',
  'Other',
]

export type ProspectKind = 'new-prospect' | 'existing-client'

export const KIND_LABELS: Record<ProspectKind, string> = {
  'new-prospect': 'New',
  'existing-client': 'Existing',
}

/** What kind of account it is — a free, user-editable list (see Settings). */
export const DEFAULT_ACCOUNT_TYPES = [
  '401(k)',
  '401(k) Roth',
  'Traditional IRA',
  'Roth IRA',
  '403(b)',
  'Brokerage',
  'Annuity',
  'Pension',
  'Cash / CD',
  'Life insurance',
  'Other',
]

/**
 * Custodians/carriers/recordkeepers an account can currently be held at — a
 * free, user-editable list (see Settings). Broad on purpose: an incoming
 * prospect's money can plausibly be sitting almost anywhere.
 */
export const DEFAULT_CUSTODIANS_HELD_AT = [
  'Fidelity',
  'Vanguard',
  'Charles Schwab',
  'Empower',
  'Edward Jones',
  'LPL Financial',
  'Merrill Lynch',
  'Morgan Stanley',
  'Ameriprise',
  'Raymond James',
  'Wells Fargo Advisors',
  'T. Rowe Price',
  'TIAA',
  'Voya',
  'Principal',
  'John Hancock',
  'Nationwide',
  'Prudential',
  'MassMutual',
  'New York Life',
  'American Funds',
  'Lincoln Financial',
  'Pacific Life',
  'Allianz',
  'UBS',
  'TD Ameritrade',
  'Other',
]

/**
 * Custodians/carriers an account can move to — a separate, free,
 * user-editable list (see Settings) from where it's held now, since in
 * practice only a handful of firms are ever actually the destination.
 */
export const DEFAULT_CUSTODIANS_MOVING_TO = [
  'Fidelity',
  'Vanguard',
  'Charles Schwab',
  'Empower',
  'Ameriprise',
  'T. Rowe Price',
  'TIAA',
  'Voya',
  'Principal',
  'John Hancock',
  'Nationwide',
  'Prudential',
  'MassMutual',
  'American Funds',
  'Lincoln Financial',
  'Pacific Life',
  'Allianz',
  'Other',
]

/**
 * How far along one pot of money is — mirrors the pipeline stage names. Not
 * user-editable: unlike `Stage`, it drives fixed color coding and isn't one
 * of the categories Settings exposes.
 */
export const ASSET_STATUSES = ['identified', 'doc-prep', 'docs-signed', 'processed', 'follow-up', 'funded'] as const

export type AssetStatus = (typeof ASSET_STATUSES)[number]

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  identified: 'Identified',
  'doc-prep': 'Doc Prep',
  'docs-signed': 'Docs Signed',
  processed: 'Processed',
  'follow-up': 'Follow Up',
  funded: 'Funded',
}

export type Asset = {
  id: string
  /** What kind of account it is — one of Settings' account types, or free text. */
  kind: string
  /** Dollars. Null when the amount is still unknown. */
  amount: number | null
  /** Where it's at now — current custodian, plan provider, or carrier. */
  heldAt: string
  /** Where it needs to go — destination custodian or account. */
  movingTo: string
  status: AssetStatus
  notes: string
}

/** One logged touch — what happened and when, not just what's true now. */
export const ACTIVITY_KINDS = ['call', 'email', 'meeting', 'note'] as const

export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
}

export const ACTIVITY_KIND_ICONS: Record<ActivityKind, string> = {
  call: '📞',
  email: '✉️',
  meeting: '🤝',
  note: '📝',
}

export type ActivityEntry = {
  id: string
  kind: ActivityKind
  text: string
  at: string
}

/** Where the next step itself stands — separate from the account Status fields. */
export const NEXT_STEP_STATUSES = ['in-process', 'completed'] as const

export type NextStepStatus = (typeof NEXT_STEP_STATUSES)[number]

export const NEXT_STEP_STATUS_LABELS: Record<NextStepStatus, string> = {
  'in-process': 'In Process',
  completed: 'Completed',
}

export type Prospect = {
  id: string
  name: string
  kind: ProspectKind
  /** Where they came from — one of Settings' sources, or free text. */
  source: string
  /** Who sent them, when the source is a referral. */
  referredBy: string
  phone: string
  email: string
  /** What kind of event created it — one of Settings' opportunity types, or free text. */
  opportunityType: string
  /** One of Settings' stage keys — resolve with `findStage`. */
  stage: Stage
  /** When `stage` last changed — how "days in stage" is measured. */
  stageChangedAt: string
  assets: Asset[]
  nextStep: string
  nextStepStatus: NextStepStatus
  /** ISO date (yyyy-mm-dd) the next step is due, or '' if unscheduled. */
  nextStepOn: string
  /** Chronological log of calls, emails, meetings, and notes — newest last. */
  activity: ActivityEntry[]
  createdAt: string
  updatedAt: string
}

/* ---------- Follow-up ---------- */

/**
 * Execution horizons. Deliberately not calendar buckets — these are commitment
 * windows. When we wire up the 12 Week Year, 'month' is the one that gives:
 * it becomes the cycle/week-of-12 view rather than a calendar month.
 */
export const HORIZONS = ['today', 'week', 'month'] as const

export type Horizon = (typeof HORIZONS)[number]

export const HORIZON_LABELS: Record<Horizon, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
}

export type FollowUp = {
  id: string
  title: string
  horizon: Horizon
  /** Who this concerns — a prospect or an existing client, searched by name. */
  prospectId: string | null
  /** Who has to do it. */
  owner: string
  /** Why — the reason this needs doing, distinct from the task itself. */
  reason: string
  /** ISO date (yyyy-mm-dd), or '' when only the horizon matters. */
  dueOn: string
  done: boolean
  completedAt: string | null
  createdAt: string
}

/* ---------- Settings ---------- */

/**
 * Good default "what happens next" prompts, tailored to where the
 * opportunity sits, keyed by stage key — offered in the Next Step typeahead
 * so advisors aren't staring at a blank field, but freeform text still works
 * since no two households are identical.
 */
export const DEFAULT_NEXT_STEP_SUGGESTIONS: Record<string, string[]> = {
  'first-meeting': [
    'Schedule the first meeting or call',
    'Confirm the meeting time and location',
    'Send a calendar invite',
  ],
  identified: [
    'Schedule the first meeting',
    'Send the fact-finder to complete before the meeting',
    'Confirm the referral source and best time to call',
    'Request the most recent statements',
  ],
  'doc-prep': [
    'Complete transfer paperwork signatures',
    'Confirm account numbers and statement copies are in hand',
    'Verify the receiving firm’s paperwork requirements',
    'Schedule a signing appointment',
  ],
  'docs-signed': [
    'Submit the signed paperwork to the receiving firm',
    'Confirm all signatures and dates are complete',
    'Provide a copy of the signed paperwork to the client',
  ],
  igo: [
    'Call the receiving firm to confirm IGO status',
    'Confirm the assets are now in good order',
    'Proceed with funding now that it’s IGO',
  ],
  nigo: [
    'Correct and resubmit any NIGO items',
    'Call the receiving firm for NIGO details',
    'Follow up once corrections are resubmitted',
  ],
  'follow-up-check': [
    'Confirm the transfer has landed with the receiving firm',
    'Check the received balance against the expected amount',
    'Notify the client the transfer is complete',
  ],
  funded: [
    'Schedule the 30-day onboarding check-in',
    'Send a welcome / thank-you note',
    'Review the new account allocation with the client',
    'Ask for a referral',
  ],
  issued: [
    'Confirm the account or policy has been issued',
    'Send the issued documents to the client',
    'Schedule a review once the account is active',
  ],
  stalled: [
    'Call to re-engage and confirm interest',
    'Send a check-in email',
    'Set a decision date to revisit',
  ],
  lost: [
    'Note the reason it fell through',
    'Set a reminder to check back in 6–12 months',
  ],
}

/**
 * Everything in the app that's meant to be tuned per-practice rather than
 * hardcoded — stage names/colors/order, and the vocabulary offered in
 * dropdowns and typeaheads. Edited from the Settings panel, persisted
 * alongside prospects/follow-ups.
 */
export type Settings = {
  stages: StageDef[]
  custodiansHeldAt: string[]
  custodiansMovingTo: string[]
  accountTypes: string[]
  sources: string[]
  opportunityTypes: string[]
  /** Suggested Next Step phrases, keyed by stage key. */
  nextStepSuggestions: Record<string, string[]>
}

export const DEFAULT_SETTINGS: Settings = {
  stages: DEFAULT_STAGES,
  custodiansHeldAt: DEFAULT_CUSTODIANS_HELD_AT,
  custodiansMovingTo: DEFAULT_CUSTODIANS_MOVING_TO,
  accountTypes: DEFAULT_ACCOUNT_TYPES,
  sources: DEFAULT_SOURCES,
  opportunityTypes: DEFAULT_OPPORTUNITY_TYPES,
  nextStepSuggestions: DEFAULT_NEXT_STEP_SUGGESTIONS,
}

/**
 * What the Pipeline page shows: the normal stage-column board, a flat list
 * of every active opportunity in one order, or every opportunity in one
 * specific stage (including the off-track ones, which the board itself
 * otherwise tucks into a collapsed strip). The last six ids below are stage
 * keys, matched directly against `Prospect.stage` — see `PipelineBoard.tsx`.
 */
export const SORTS = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'amount-desc', label: 'Highest dollar amount' },
  { id: 'newest', label: 'Newest Opportunity' },
  { id: 'oldest', label: 'Oldest Opportunity' },
  { id: 'doc-prep', label: 'Doc Prep' },
  { id: 'docs-signed', label: 'Signed' },
  { id: 'igo', label: 'IGO' },
  { id: 'nigo', label: 'NIGO' },
  { id: 'follow-up-check', label: 'Follow Up' },
  { id: 'funded', label: 'Funded' },
  { id: 'issued', label: 'Issued' },
  { id: 'stalled', label: 'Stalled' },
  { id: 'lost', label: 'Lost' },
] as const

export type SortBy = (typeof SORTS)[number]['id']
