import type { Prospect, StageDef } from '../../types'
import { findStage } from '../../types'
import { BORDER, FG, MUTED } from '../../ui/theme'
import { Modal } from '../../ui/primitives'
import { BoardCard, CardGrid } from './PipelineBoard'

type Props = {
  /** Every archived opportunity — deliberately not narrowed by Quick View or Search. */
  archived: Prospect[]
  stages: StageDef[]
  onOpen: (prospect: Prospect) => void
  onClose: () => void
}

/** Where archived opportunities live: off the board and out of every total,
 *  but all of them here. Open one to read it, or to Unarchive it. */
export function ArchiveVault({ archived, stages, onOpen, onClose }: Props) {
  const newestFirst = [...archived].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <Modal onClose={onClose} width={1180}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: FG }}>
          Archive Vault <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>({archived.length})</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 20, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: '18px 20px', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
        {newestFirst.length === 0 ? (
          <div style={{ fontSize: 13, color: MUTED }}>Nothing archived yet. Use Archive on an opportunity to put it here.</div>
        ) : (
          <CardGrid>
            {newestFirst.map((p) => (
              <BoardCard key={p.id} prospect={p} color={findStage(stages, p.stage).color} onOpen={() => onOpen(p)} />
            ))}
          </CardGrid>
        )}
      </div>
    </Modal>
  )
}
