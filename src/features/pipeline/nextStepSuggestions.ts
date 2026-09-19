import type { Stage } from '../../types'

/**
 * Good default "what happens next" prompts, tailored to where the opportunity
 * sits — offered in the Next Step typeahead so advisors aren't staring at a
 * blank field, but freeform text still works since no two households are
 * identical.
 */
export const NEXT_STEP_SUGGESTIONS: Record<Stage, string[]> = {
  identified: [
    'Schedule the first meeting',
    'Send the fact-finder to complete before the meeting',
    'Confirm the referral source and best time to call',
    'Request the most recent statements',
  ],
  'doc-prep': [
    'Send transfer paperwork for signature',
    'Confirm account numbers and statement copies are in hand',
    'Verify the receiving firm’s paperwork requirements',
    'Schedule a signing appointment',
  ],
  'docs-signed': [
    'Submit the signed paperwork to the receiving firm',
    'Confirm all signatures and dates are complete',
    'Provide a copy of the signed paperwork to the client',
  ],
  'igo-nigo': [
    'Call the receiving firm for IGO/NIGO status',
    'Correct and resubmit any NIGO items',
    'Confirm the assets are now in good order',
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
