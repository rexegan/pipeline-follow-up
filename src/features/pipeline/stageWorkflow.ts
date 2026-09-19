import type { Stage } from '../../types'
import { addDays, today } from '../../lib/dates'

/**
 * What a stage typically calls for next, borrowed from how Redtail/Wealthbox
 * trigger a task off a pipeline stage change instead of leaving it to memory.
 * `null` means the stage itself doesn't imply a next action (arriving there
 * usually follows one, or it's an end state).
 */
const STAGE_FOLLOWUP: Partial<Record<Stage, { task: string; days: number }>> = {
  'doc-prep': { task: 'Send the paperwork for signature', days: 3 },
  'docs-signed': { task: 'Submit the signed paperwork to the receiving firm', days: 2 },
  'igo-nigo': { task: 'Check IGO/NIGO status with the receiving firm', days: 3 },
  'follow-up-check': { task: 'Confirm the transfer has landed', days: 5 },
  funded: { task: 'Schedule the 30-day onboarding check-in', days: 30 },
}

export type StageSuggestion = { title: string; dueOn: string }

export function suggestFollowUpFor(stage: Stage): StageSuggestion | null {
  const entry = STAGE_FOLLOWUP[stage]
  if (!entry) return null
  return { title: entry.task, dueOn: addDays(today(), entry.days) }
}
