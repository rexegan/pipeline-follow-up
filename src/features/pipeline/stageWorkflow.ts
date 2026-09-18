import type { Stage } from '../../types'
import { addDays, today } from '../../lib/dates'

/**
 * What a stage typically calls for next, borrowed from how Redtail/Wealthbox
 * trigger a task off a pipeline stage change instead of leaving it to memory.
 * `null` means the stage itself doesn't imply a next action (arriving there
 * usually follows one, or it's an end state).
 */
const STAGE_FOLLOWUP: Partial<Record<Stage, { task: string; days: number }>> = {
  contacted: { task: 'Schedule a first meeting', days: 3 },
  'appointment-set': { task: 'Prep for the first meeting', days: 1 },
  'first-meeting-held': { task: 'Send the follow-up summary and next steps', days: 2 },
  'plan-presented': { task: 'Follow up on the plan decision', days: 3 },
  'paperwork-out': { task: 'Confirm the paperwork was signed and returned', days: 5 },
  'transfer-in-progress': { task: 'Confirm the transfer has landed', days: 7 },
  funded: { task: 'Schedule the 30-day onboarding check-in', days: 30 },
}

export type StageSuggestion = { title: string; dueOn: string }

export function suggestFollowUpFor(stage: Stage): StageSuggestion | null {
  const entry = STAGE_FOLLOWUP[stage]
  if (!entry) return null
  return { title: entry.task, dueOn: addDays(today(), entry.days) }
}
