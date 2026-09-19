import type { Asset, Stage } from '../../types'
import { DANGER, MUTED, SUCCESS, WARN } from '../../ui/theme'

export const STAGE_COLOR: Record<Stage, string> = {
  identified: MUTED,
  'doc-prep': '#1d4ed8',
  'docs-signed': '#6d28d9',
  'igo-nigo': WARN,
  'follow-up-check': '#0f766e',
  funded: SUCCESS,
  stalled: '#a16207',
  lost: DANGER,
}

export const ASSET_STATUS_COLOR: Record<Asset['status'], string> = {
  identified: MUTED,
  'doc-prep': '#1d4ed8',
  'docs-signed': '#6d28d9',
  processed: WARN,
  'follow-up': '#0f766e',
  funded: SUCCESS,
}
