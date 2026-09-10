import { C } from '../../ui/theme'
import type { AssetStatus, Stage } from '../../types'

export const STAGE_COLORS: Record<Stage, string> = {
  identified: C.muted,
  contacted: C.teal,
  'appointment-set': C.accent,
  'first-meeting-held': C.accent,
  'plan-presented': C.purple,
  'paperwork-out': C.gold,
  'transfer-in-progress': C.orange,
  funded: C.green,
  stalled: '#8a6d3b',
  lost: C.red,
}

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  identified: C.muted,
  paperwork: C.gold,
  'in-transit': C.orange,
  landed: C.green,
}
