import type { Asset, Stage } from '../../types'
import { DANGER, MUTED, SUCCESS, WARN } from '../../ui/theme'

export const STAGE_COLOR: Record<Stage, string> = {
  identified: MUTED,
  contacted: '#3f3f46',
  'appointment-set': '#1d4ed8',
  'first-meeting-held': '#1d4ed8',
  'plan-presented': '#6d28d9',
  'paperwork-out': WARN,
  'transfer-in-progress': WARN,
  funded: SUCCESS,
  stalled: '#a16207',
  lost: DANGER,
}

export const ASSET_STATUS_COLOR: Record<Asset['status'], string> = {
  identified: MUTED,
  paperwork: WARN,
  'in-transit': WARN,
  landed: SUCCESS,
}
