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
    source: 'dave-ramsey',
    referredBy: 'SmartVestor lead 9/2',
    phone: '(817) 555-0142',
    email: 'bhoffman@example.com',
    stage: 'doc-prep',
    stageChangedAt: daysAgo(2),
    assets: [
      {
        id: uid(),
        kind: '401k',
        amount: 412000,
        heldAt: 'fidelity',
        movingTo: 'lpl-financial',
        status: 'identified',
        notes: '',
      },
      {
        id: uid(),
        kind: 'roth-ira',
        amount: 86500,
        heldAt: 'edward-jones',
        movingTo: 'lpl-financial',
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
    source: 'client-referral',
    referredBy: 'Referred by the Hoffmans',
    phone: '(817) 555-0198',
    email: '',
    stage: 'identified',
    stageChangedAt: daysAgo(1),
    assets: [
      {
        id: uid(),
        kind: 'brokerage',
        amount: 95000,
        heldAt: 'edward-jones',
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
