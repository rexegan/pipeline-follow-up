/* ---------- Pipeline ---------- */

/** Stages an opportunity moves through, in order. */
export const ACTIVE_STAGES = [
  'identified',
  'contacted',
  'appointment-set',
  'first-meeting-held',
  'plan-presented',
  'paperwork-out',
  'transfer-in-progress',
  'funded',
] as const

/** States an opportunity falls out to; they leave the forward-motion counts. */
export const OFF_TRACK_STAGES = ['stalled', 'lost'] as const

export const STAGES = [...ACTIVE_STAGES, ...OFF_TRACK_STAGES] as const

export type Stage = (typeof STAGES)[number]

export const STAGE_LABELS: Record<Stage, string> = {
  identified: 'Identified',
  contacted: 'Contacted',
  'appointment-set': 'Appointment set',
  'first-meeting-held': 'First meeting held',
  'plan-presented': 'Plan presented',
  'paperwork-out': 'Paperwork out',
  'transfer-in-progress': 'Transfer in progress',
  funded: 'Funded',
  stalled: 'Stalled',
  lost: 'Lost',
}

/** Where the opportunity came from. */
export const SOURCES = [
  'dave-ramsey',
  'client-referral',
  'coi',
  'existing-client',
  'seminar',
  'walk-in',
  'other',
] as const

export type Source = (typeof SOURCES)[number]

export const SOURCE_LABELS: Record<Source, string> = {
  'dave-ramsey': 'Dave Ramsey',
  'client-referral': 'Client referral',
  coi: 'Center of influence',
  'existing-client': 'Existing client',
  seminar: 'Seminar / event',
  'walk-in': 'Walk-in / inbound',
  other: 'Other',
}

/** Sources where naming the referrer is the point; drives a conditional field. */
export const REFERRAL_SOURCES: Source[] = ['dave-ramsey', 'client-referral', 'coi']

export type ProspectKind = 'new-prospect' | 'existing-client'

export const KIND_LABELS: Record<ProspectKind, string> = {
  'new-prospect': 'New',
  'existing-client': 'Existing',
}

export const ASSET_KINDS = [
  '401k',
  '403b',
  'ira',
  'roth-ira',
  'brokerage',
  'annuity',
  'pension',
  'cash',
  'life-insurance',
  'other',
] as const

export type AssetKind = (typeof ASSET_KINDS)[number]

export const ASSET_KIND_LABELS: Record<AssetKind, string> = {
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

/** How far along one pot of money is in actually moving. */
export const ASSET_STATUSES = ['identified', 'paperwork', 'in-transit', 'landed'] as const

export type AssetStatus = (typeof ASSET_STATUSES)[number]

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  identified: 'Identified',
  paperwork: 'Paperwork',
  'in-transit': 'In transit',
  landed: 'Landed',
}

export type Asset = {
  id: string
  kind: AssetKind
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

export type Prospect = {
  id: string
  name: string
  kind: ProspectKind
  source: Source
  /** Who sent them, when the source is a referral. */
  referredBy: string
  phone: string
  email: string
  stage: Stage
  /** When `stage` last changed — how "days in stage" is measured. */
  stageChangedAt: string
  assets: Asset[]
  nextStep: string
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
  /** Optional link back to the pipeline opportunity this serves. */
  prospectId: string | null
  owner: string
  /** ISO date (yyyy-mm-dd), or '' when only the horizon matters. */
  dueOn: string
  done: boolean
  completedAt: string | null
  createdAt: string
}
