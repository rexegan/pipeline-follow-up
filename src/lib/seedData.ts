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
        movingTo: 'LPL Financial',
        status: 'identified',
        notes: '',
      },
      {
        id: uid(),
        kind: 'Roth IRA',
        amount: 86500,
        heldAt: 'Edward Jones',
        movingTo: 'LPL Financial',
        status: 'identified',
        notes: '',
      },
    ],
    nextStep: 'Send transfer paperwork for the Lockheed 401(k)',
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
        movingTo: '',
        status: 'identified',
        notes: '',
      },
    ],
    nextStep: 'Call to set up the first meeting',
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
 * Ten opportunities scattered across every stage, source, and dollar range —
 * added on demand from the sidebar ("+ Load sample opportunities") rather
 * than the one-time first-load seed, so it's useful even on a browser
 * that's already past that.
 */
export function sampleProspects(): Prospect[] {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

  const asset = (kind: string, amount: number, heldAt: string, movingTo: string, status: Prospect['assets'][number]['status']) => ({
    id: uid(),
    kind,
    amount,
    heldAt,
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
      stage: 'igo-nigo',
      createdDaysAgo: 30,
      assets: [asset('Brokerage', 1000000, 'Morgan Stanley', 'UBS', 'processed')],
      nextStep: 'Call the receiving firm for IGO/NIGO status',
      activityText: 'Paperwork submitted — waiting on UBS to confirm it is in good order.',
    }),
    make({
      name: 'Whitfield, Sarah',
      kind: 'new-prospect',
      source: 'Center of influence',
      referredBy: "CPA referral — Miller & Associates",
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
