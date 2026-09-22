import type { FollowUp, Prospect } from '../types'
import { addDays, today, uid } from './dates'

/**
 * Shown once, on a browser that has never had data in it — so the first
 * thing anyone sees (opening the GitHub Pages link, say) is a populated
 * example instead of an empty state. Marked seeded after first load, so
 * deleting everything later doesn't bring it back.
 */
export function seedProspects(): Prospect[] {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

  const hoffman: Prospect = {
    id: uid(),
    name: 'Hoffman, Bill & Karen',
    kind: 'new-prospect',
    source: 'Dave Ramsey',
    referredBy: 'SmartVestor lead 9/2',
    phone: '(817) 555-0142',
    email: 'bhoffman@example.com',
    stage: 'doc-prep',
    stageChangedAt: daysAgo(2),
    assets: [
      {
        id: uid(),
        kind: '401(k)',
        amount: 412000,
        heldAt: 'Fidelity',
        newAccountType: '401(k)',
        movingTo: 'LPL Financial',
        status: 'identified',
        notes: '',
      },
      {
        id: uid(),
        kind: 'Roth IRA',
        amount: 86500,
        heldAt: 'Edward Jones',
        newAccountType: 'Roth IRA',
        movingTo: 'LPL Financial',
        status: 'identified',
        notes: '',
      },
    ],
    nextStep: 'Send transfer paperwork for the Lockheed 401(k)',
    nextStepStatus: 'in-process',
    nextStepOn: addDays(today(), 4),
    activity: [
      { id: uid(), kind: 'call', text: 'SmartVestor lead came in, left a voicemail', at: daysAgo(9) },
      { id: uid(), kind: 'call', text: 'Bill called back — both retiring within 18 months, want a second opinion on the 401(k)', at: daysAgo(8) },
      { id: uid(), kind: 'meeting', text: 'First meeting. Reviewed both statements, walked through rollover options.', at: daysAgo(2) },
      { id: uid(), kind: 'note', text: 'Karen wants her sister (a CPA) to look over the plan before they sign anything.', at: daysAgo(2) },
    ],
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
  }

  const garcia: Prospect = {
    id: uid(),
    name: 'Garcia, Robert',
    kind: 'existing-client',
    source: 'Client referral',
    referredBy: 'Referred by the Hoffmans',
    phone: '(817) 555-0198',
    email: '',
    stage: 'identified',
    stageChangedAt: daysAgo(1),
    assets: [
      {
        id: uid(),
        kind: 'Brokerage',
        amount: 95000,
        heldAt: 'Edward Jones',
        newAccountType: 'Brokerage',
        movingTo: '',
        status: 'identified',
        notes: '',
      },
    ],
    nextStep: 'Call to set up the first meeting',
    nextStepStatus: 'in-process',
    nextStepOn: addDays(today(), 1),
    activity: [
      { id: uid(), kind: 'email', text: 'Bill Hoffman referred him — sent an intro email', at: daysAgo(1) },
    ],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }

  return [hoffman, garcia]
}

/**
 * Twenty opportunities scattered across every stage, source, account type,
 * and dollar range — added on demand from the sidebar ("+ Load sample
 * opportunities") rather than the one-time first-load seed, so it's useful
 * for trying out sorting/filtering with real volume behind it.
 */
export function sampleProspects(): Prospect[] {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

  const asset = (kind: string, amount: number, heldAt: string, movingTo: string, status: Prospect['assets'][number]['status']) => ({
    id: uid(),
    kind,
    amount,
    heldAt,
    newAccountType: kind,
    movingTo,
    status,
    notes: '',
  })

  const make = (p: {
    name: string
    kind: Prospect['kind']
    source: string
    referredBy?: string
    stage: string
    createdDaysAgo: number
    assets: Prospect['assets']
    nextStep: string
    activityText: string
  }): Prospect => {
    const createdAt = daysAgo(p.createdDaysAgo)
    return {
      id: uid(),
      name: p.name,
      kind: p.kind,
      source: p.source,
      referredBy: p.referredBy ?? '',
      phone: '',
      email: '',
      stage: p.stage,
      stageChangedAt: createdAt,
      assets: p.assets,
      nextStep: p.nextStep,
      nextStepStatus: 'in-process',
      nextStepOn: addDays(today(), Math.floor(Math.random() * 10) - 3),
      activity: [{ id: uid(), kind: 'note', text: p.activityText, at: createdAt }],
      createdAt,
      updatedAt: createdAt,
    }
  }

  return [
    make({
      name: 'Thompson, Diane',
      kind: 'existing-client',
      source: 'Client referral',
      referredBy: 'Referred by the Garcias',
      stage: 'identified',
      createdDaysAgo: 5,
      assets: [asset('Traditional IRA', 210000, 'Vanguard', '', 'identified')],
      nextStep: 'Schedule the first meeting',
      activityText: 'Referred in by the Garcias — reached out to set up a first meeting.',
    }),
    make({
      name: 'Patel, Raj & Anita',
      kind: 'new-prospect',
      source: 'Dave Ramsey',
      referredBy: 'SmartVestor lead',
      stage: 'doc-prep',
      createdDaysAgo: 12,
      assets: [asset('401(k)', 650000, 'Empower', 'Fidelity', 'doc-prep')],
      nextStep: 'Send transfer paperwork for signature',
      activityText: 'First meeting went well — moving both 401(k)s to Fidelity.',
    }),
    make({
      name: 'Nguyen, Linh',
      kind: 'new-prospect',
      source: 'Seminar / event',
      stage: 'docs-signed',
      createdDaysAgo: 20,
      assets: [asset('Roth IRA', 75000, 'Charles Schwab', 'LPL Financial', 'docs-signed')],
      nextStep: 'Submit the signed paperwork to the receiving firm',
      activityText: 'Signed at the retirement seminar follow-up meeting.',
    }),
    make({
      name: 'Coleman, Marcus',
      kind: 'existing-client',
      source: 'Existing client',
      stage: 'igo',
      createdDaysAgo: 30,
      assets: [asset('Brokerage', 1000000, 'Morgan Stanley', 'UBS', 'processed')],
      nextStep: 'Confirm the assets are now in good order',
      activityText: 'Paperwork came back in good order — proceeding toward funding.',
    }),
    make({
      name: 'Whitfield, Sarah',
      kind: 'new-prospect',
      source: 'Center of influence',
      referredBy: 'CPA referral — Miller & Associates',
      stage: 'follow-up-check',
      createdDaysAgo: 40,
      assets: [asset('403(b)', 340000, 'TIAA', 'Fidelity', 'follow-up')],
      nextStep: 'Confirm the transfer has landed with the receiving firm',
      activityText: 'Transfer submitted a week ago — checking that it landed.',
    }),
    make({
      name: 'Delgado, Miguel & Elena',
      kind: 'existing-client',
      source: 'Client referral',
      stage: 'funded',
      createdDaysAgo: 90,
      assets: [asset('Annuity', 480000, 'Prudential', 'Raymond James', 'funded')],
      nextStep: 'Schedule the 30-day onboarding check-in',
      activityText: 'Funded and confirmed — scheduling the onboarding check-in.',
    }),
    make({
      name: 'Osei, Kwame',
      kind: 'new-prospect',
      source: 'Walk-in / inbound',
      stage: 'identified',
      createdDaysAgo: 2,
      assets: [asset('Cash / CD', 28000, '', '', 'identified')],
      nextStep: 'Request the most recent statements',
      activityText: 'Walked in asking about CD rates — worth a first meeting.',
    }),
    make({
      name: 'Bianchi, Sofia',
      kind: 'new-prospect',
      source: 'Dave Ramsey',
      referredBy: 'SmartVestor lead',
      stage: 'doc-prep',
      createdDaysAgo: 6,
      assets: [asset('Traditional IRA', 95500, 'Edward Jones', 'LPL Financial', 'doc-prep')],
      nextStep: 'Confirm account numbers and statement copies are in hand',
      activityText: 'SmartVestor lead — ready to move her IRA over.',
    }),
    make({
      name: 'Harmon, Trevor',
      kind: 'existing-client',
      source: 'Other',
      stage: 'stalled',
      createdDaysAgo: 60,
      assets: [asset('Brokerage', 150000, 'Ameriprise', '', 'identified')],
      nextStep: 'Call to re-engage and confirm interest',
      activityText: 'Went quiet after the second meeting — hasn’t returned calls.',
    }),
    make({
      name: 'Iverson, Cassandra',
      kind: 'new-prospect',
      source: 'Seminar / event',
      stage: 'lost',
      createdDaysAgo: 100,
      assets: [asset('401(k)', 220000, 'Voya', '', 'identified')],
      nextStep: 'Note the reason it fell through',
      activityText: 'Decided to stay with her current advisor.',
    }),
    make({
      name: 'Whitmore, Gerald',
      kind: 'existing-client',
      source: 'Existing client',
      stage: 'nigo',
      createdDaysAgo: 15,
      assets: [asset('401(k) Roth', 340000, 'John Hancock', 'Fidelity', 'processed')],
      nextStep: 'Correct and resubmit any NIGO items',
      activityText: 'Paperwork came back NIGO — missing a signature page.',
    }),
    make({
      name: 'Alvarez, Camila',
      kind: 'new-prospect',
      source: 'Dave Ramsey',
      referredBy: 'SmartVestor lead',
      stage: 'identified',
      createdDaysAgo: 1,
      assets: [asset('Roth IRA', 62000, 'Charles Schwab', '', 'identified')],
      nextStep: 'Schedule the first meeting',
      activityText: 'New SmartVestor lead came in overnight.',
    }),
    make({
      name: 'Fitzgerald, Owen',
      kind: 'new-prospect',
      source: 'Center of influence',
      referredBy: 'CPA referral',
      stage: 'doc-prep',
      createdDaysAgo: 8,
      assets: [asset('Pension', 890000, 'Nationwide', 'Vanguard', 'doc-prep')],
      nextStep: 'Complete transfer paperwork signatures',
      activityText: 'Large pension rollover — CPA introduced him this week.',
    }),
    make({
      name: 'Reyes, Isabella',
      kind: 'existing-client',
      source: 'Client referral',
      stage: 'docs-signed',
      createdDaysAgo: 25,
      assets: [asset('Life insurance', 45000, 'MassMutual', 'Principal', 'docs-signed')],
      nextStep: 'Submit the signed paperwork to the receiving firm',
      activityText: 'Signed the policy transfer paperwork this week.',
    }),
    make({
      name: 'Chukwu, Adaeze',
      kind: 'new-prospect',
      source: 'Walk-in / inbound',
      stage: 'igo',
      createdDaysAgo: 35,
      assets: [asset('Brokerage', 1150000, 'TD Ameritrade', 'Allianz', 'processed')],
      nextStep: 'Proceed with funding now that it’s IGO',
      activityText: 'Confirmed in good order — largest account this quarter.',
    }),
    make({
      name: 'Larsen, Peter',
      kind: 'existing-client',
      source: 'Other',
      stage: 'nigo',
      createdDaysAgo: 18,
      assets: [asset('403(b)', 198000, 'Lincoln Financial', 'Empower', 'processed')],
      nextStep: 'Call the receiving firm for NIGO details',
      activityText: 'Receiving firm flagged a date mismatch on the form.',
    }),
    make({
      name: 'Okafor, Chidi',
      kind: 'new-prospect',
      source: 'Seminar / event',
      stage: 'follow-up-check',
      createdDaysAgo: 45,
      assets: [asset('Traditional IRA', 410000, 'Pacific Life', 'American Funds', 'follow-up')],
      nextStep: 'Check the received balance against the expected amount',
      activityText: 'Transfer submitted — confirming the balance landed correctly.',
    }),
    make({
      name: 'Sinclair, Margaret',
      kind: 'existing-client',
      source: 'Existing client',
      stage: 'funded',
      createdDaysAgo: 120,
      assets: [asset('Annuity', 265000, 'New York Life', 'T. Rowe Price', 'funded')],
      nextStep: 'Send a welcome / thank-you note',
      activityText: 'Funded three months ago — sending a thank-you note.',
    }),
    make({
      name: 'Nakamura, Ren',
      kind: 'new-prospect',
      source: 'Dave Ramsey',
      referredBy: 'SmartVestor lead',
      stage: 'stalled',
      createdDaysAgo: 70,
      assets: [asset('401(k)', 77000, 'Wells Fargo Advisors', '', 'identified')],
      nextStep: 'Send a check-in email',
      activityText: 'Hasn’t responded to the last two check-ins.',
    }),
    make({
      name: 'Bishop, Wendell',
      kind: 'new-prospect',
      source: 'Other',
      stage: 'lost',
      createdDaysAgo: 150,
      assets: [asset('Cash / CD', 15000, 'Merrill Lynch', '', 'identified')],
      nextStep: 'Note the reason it fell through',
      activityText: 'Decided the CD rate wasn’t worth moving for.',
    }),
  ]
}

export function seedFollowUps(hoffmanId: string): FollowUp[] {
  const now = new Date().toISOString()
  return [
    {
      id: uid(),
      title: 'Call Fidelity for the Lockheed 401(k) transfer packet',
      horizon: 'today',
      prospectId: hoffmanId,
      owner: 'Rex',
      reason: 'Need the packet in hand before the plan presentation',
      dueOn: today(),
      done: false,
      completedAt: null,
      createdAt: now,
    },
    {
      id: uid(),
      title: 'Prep the plan presentation for the Hoffmans',
      horizon: 'week',
      prospectId: hoffmanId,
      owner: '',
      reason: 'Karen wants her CPA sister to review it before they decide',
      dueOn: addDays(today(), 4),
      done: false,
      completedAt: null,
      createdAt: now,
    },
    {
      id: uid(),
      title: 'Review all open Dave Ramsey referrals from the last 90 days',
      horizon: 'month',
      prospectId: null,
      owner: '',
      reason: 'Monthly check that SmartVestor leads aren’t going stale',
      dueOn: addDays(today(), 21),
      done: false,
      completedAt: null,
      createdAt: now,
    },
  ]
}
