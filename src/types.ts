export const STAGES = ['new', 'contacted', 'in-progress', 'waiting', 'closed'] as const

export type Stage = (typeof STAGES)[number]

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'New',
  contacted: 'Contacted',
  'in-progress': 'In progress',
  waiting: 'Waiting on them',
  closed: 'Closed',
}

export type Item = {
  id: string
  title: string
  owner: string
  notes: string
  stage: Stage
  /** ISO date (yyyy-mm-dd) for the next follow-up, or '' if none scheduled. */
  followUpOn: string
  createdAt: string
  /** ISO timestamps of each recorded touch, newest last. */
  touches: string[]
}

export type ItemDraft = Pick<Item, 'title' | 'owner' | 'notes' | 'stage' | 'followUpOn'>
