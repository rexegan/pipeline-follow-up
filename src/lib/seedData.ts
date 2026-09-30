import type { Prospect } from '../types'
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
    middleInitial: '',
    kind: 'new-prospect',
    source: 'Dave Ramsey',
    referredBy: 'SmartVestor lead 9/2',
    relationship: '',
    phone: '(817) 555-0142',
    email: 'bhoffman@example.com',
    stage: 'doc-prep',
    stageChangedAt: daysAgo(2),
    assignedTo: '',
    assets: [
      {
        id: uid(),
        kind: '401(k)',
        amount: 412000,
        heldAt: 'Fidelity',
        newAccountType: '401(k)',
        movingTo: 'LPL Financial',
        investmentType: 'Mutual Fund',
        productName: '',
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
        investmentType: 'ETF',
        productName: '',
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
    middleInitial: 'A',
    kind: 'existing-client',
    source: 'Client referral',
    referredBy: 'Referred by the Hoffmans',
    relationship: 'Friend',
    phone: '(817) 555-0198',
    email: '',
    stage: 'identified',
    stageChangedAt: daysAgo(1),
    assignedTo: '',
    assets: [
      {
        id: uid(),
        kind: 'Brokerage',
        amount: 95000,
        heldAt: 'Edward Jones',
        newAccountType: 'Brokerage',
        movingTo: '',
        investmentType: 'Mutual Fund',
        productName: '',
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
