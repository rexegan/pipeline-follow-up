import type { Asset, Prospect } from '../../types'
import { uid } from '../../lib/dates'

export const blankAsset = (): Asset => ({
  id: uid(),
  kind: '401k',
  amount: null,
  heldAt: '',
  movingTo: '',
  status: 'identified',
  notes: '',
})

export const blankProspect = (): Prospect => {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: '',
    kind: 'new-prospect',
    source: 'dave-ramsey',
    referredBy: '',
    phone: '',
    email: '',
    stage: 'identified',
    stageChangedAt: now,
    assets: [blankAsset()],
    nextStep: '',
    nextStepOn: '',
    activity: [],
    createdAt: now,
    updatedAt: now,
  }
}
