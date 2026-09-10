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

export const blankProspect = (): Prospect => ({
  id: uid(),
  name: '',
  kind: 'new-prospect',
  source: 'dave-ramsey',
  referredBy: '',
  phone: '',
  email: '',
  stage: 'identified',
  assets: [blankAsset()],
  nextStep: '',
  nextStepOn: '',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})
