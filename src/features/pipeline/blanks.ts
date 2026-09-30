import type { Asset, Prospect } from '../../types'
import { uid } from '../../lib/dates'

export const blankAsset = (defaultKind = ''): Asset => ({
  id: uid(),
  kind: defaultKind,
  amount: null,
  heldAt: '',
  currentInvestmentType: '',
  newAccountType: defaultKind,
  movingTo: '',
  investmentType: '',
  productName: '',
  status: 'identified',
  notes: '',
})

export const blankProspect = (defaultStage: string, defaultAccountType = ''): Prospect => {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: '',
    middleInitial: '',
    kind: 'new-prospect',
    source: '',
    referredBy: '',
    relationship: '',
    phone: '',
    email: '',
    manualTotal: null,
    stage: defaultStage,
    stageChangedAt: now,
    assets: [blankAsset(defaultAccountType)],
    assignedTo: '',
    nextStep: '',
    nextStepStatus: 'in-process',
    nextStepOn: '',
    activity: [],
    createdAt: now,
    updatedAt: now,
  }
}
