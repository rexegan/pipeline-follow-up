import type { Asset, Prospect } from '../../types'
import { uid } from '../../lib/dates'

export const blankAsset = (defaultKind = ''): Asset => ({
  id: uid(),
  kind: defaultKind,
  amount: null,
  heldAt: '',
  movingTo: '',
  status: 'identified',
  notes: '',
})

export const blankProspect = (defaultStage: string, defaultAccountType = ''): Prospect => {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: '',
    kind: 'new-prospect',
    source: '',
    referredBy: '',
    phone: '',
    email: '',
    stage: defaultStage,
    stageChangedAt: now,
    assets: [blankAsset(defaultAccountType)],
    nextStep: '',
    nextStepOn: '',
    activity: [],
    createdAt: now,
    updatedAt: now,
  }
}
