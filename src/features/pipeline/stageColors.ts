import type { Asset } from '../../types'
import { MUTED, SUCCESS, WARN } from '../../ui/theme'

/**
 * Stage color now lives on each `StageDef` (see `types.ts`) since stages are
 * user-editable — look it up with `findStage(stages, key).color`. Asset
 * status is still a fixed enum, so it keeps its own static color table.
 */
export const ASSET_STATUS_COLOR: Record<Asset['status'], string> = {
  identified: MUTED,
  'doc-prep': '#1d4ed8',
  'docs-signed': '#6d28d9',
  processed: WARN,
  'follow-up': '#0f766e',
  funded: SUCCESS,
}
