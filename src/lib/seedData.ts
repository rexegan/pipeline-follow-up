import type { FollowUp, Prospect } from '../types'
import { addDays, today, uid } from './dates'

/**
 * Shown once, on a browser that has never had data in it — so the first
 * thing anyone sees (opening the GitHub Pages link, say) is a populated
 * example instead of an empty state. Marked seeded after first load, so
 * deleting everything later doesn't bring it back.
 */
export function seedProspects(): Prospect[] {
  const now = new Date().toISOString()
  const hoffman: Prospect = {
    id: uid(),
    name: 'Hoffman, Bill & Karen',
    kind: 'new-prospect',
    source: 'dave-ramsey',
    referredBy: 'SmartVestor lead 9/2',
    phone: '(817) 555-0142',
    email: 'bhoffman@example.com',
    stage: 'first-meeting-held',
    assets: [
      {
        id: uid(),
        kind: '401k',
        amount: 412000,
        heldAt: 'Fidelity 401(k) — Lockheed',
        movingTo: 'LPL rollover IRA',
        status: 'identified',
        notes: '',
      },
      {
        id: uid(),
        kind: 'roth-ira',
        amount: 86500,
        heldAt: 'Edward Jones Roth',
        movingTo: 'LPL Roth IRA',
        status: 'identified',
        notes: '',
      },
    ],
    nextStep: 'Send transfer paperwork for the Lockheed 401(k)',
    nextStepOn: addDays(today(), 4),
    notes: '',
    createdAt: now,
    updatedAt: now,
  }

  const garcia: Prospect = {
    id: uid(),
    name: 'Garcia, Robert',
    kind: 'existing-client',
    source: 'client-referral',
    referredBy: 'Referred by the Hoffmans',
    phone: '(817) 555-0198',
    email: '',
    stage: 'contacted',
    assets: [
      {
        id: uid(),
        kind: 'brokerage',
        amount: 95000,
        heldAt: 'Edward Jones brokerage',
        movingTo: '',
        status: 'identified',
        notes: '',
      },
    ],
    nextStep: 'Call to set up the first meeting',
    nextStepOn: addDays(today(), 1),
    notes: '',
    createdAt: now,
    updatedAt: now,
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
      dueOn: addDays(today(), 21),
      done: false,
      completedAt: null,
      createdAt: now,
    },
  ]
}
