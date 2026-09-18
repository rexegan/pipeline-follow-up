/**
 * Design tokens taken from the Trade Blotter (advisortool @ f35c984,
 * "Redesign Trade Blotter with shadcn/ui white style") — a zinc palette,
 * Inter, dense 13px rows, near-black primary buttons.
 */
export const BG = '#ffffff'
export const SIDEBAR = '#fafafa'
export const CARD = '#ffffff'
export const FG = '#09090b' // zinc-950
export const MUTED = '#71717a' // zinc-500
export const MUTED_BG = '#f4f4f5' // zinc-100
export const BORDER = '#e4e4e7' // zinc-200
export const PRIMARY = '#18181b' // zinc-900
export const SUCCESS = '#16a34a' // green-600
export const DANGER = '#dc2626' // red-600
export const WARN = '#d97706' // amber-600
export const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"

/** Column-group identity, the blotter's organising device. */
export type Group = 'who' | 'current' | 'destination' | 'track'

export const GRP_META: Record<Group, { color: string; bg: string; label: string; icon: string }> = {
  who: { color: '#3f3f46', bg: '#f4f4f5', label: 'Prospect', icon: '👤' },
  current: { color: '#1d4ed8', bg: '#eff6ff', label: 'What They Have', icon: '💼' },
  destination: { color: '#6d28d9', bg: '#f5f3ff', label: 'Where It Needs To Go', icon: '📈' },
  track: { color: '#15803d', bg: '#f0fdf4', label: 'Stage & Next Step', icon: '✅' },
}

/**
 * Password-manager extensions (LastPass, 1Password, Dashlane…) inject an icon
 * into any field they guess is a login field, which on a dense data grid means
 * almost every cell. These are the attributes each vendor documents for
 * opting a field out; autoComplete="off" alone doesn't stop LastPass.
 */
export const NO_PASSWORD_MANAGER = {
  autoComplete: 'off',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
} as const

export const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${BG}; color: ${FG}; font-family: ${SANS}; }

  .box-input:focus { border-color: #a1a1aa !important; background: ${MUTED_BG}; }
  .record-card:hover { border-color: #d4d4d8; }
  .combo-option:hover { background: ${MUTED_BG}; }

  .b-del {
    background: none; border: none; color: ${DANGER}; cursor: pointer;
    font-size: 16px; font-weight: 700; padding: 2px 6px; border-radius: 4px; line-height: 1;
  }
  .b-del:hover { background: #fef2f2; }

  .b-plus {
    background: none; border: none; color: #a1a1aa; cursor: pointer;
    font-size: 14px; padding: 2px 5px; border-radius: 4px; line-height: 1;
  }
  .b-plus:hover { color: ${FG}; background: ${MUTED_BG}; }

  .b-add {
    display: block; width: 100%; text-align: left; background: none; border: none;
    padding: 9px 12px; font-size: 13px; font-weight: 500; color: ${MUTED};
    cursor: pointer; font-family: ${SANS};
  }
  .b-add:hover { background: ${MUTED_BG}; color: ${FG}; }

  .side-btn {
    display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
    background: transparent; border: none; color: ${MUTED}; border-radius: 6px;
    padding: 6px 8px; margin-bottom: 1px; font-size: 13px; font-weight: 500;
    cursor: pointer; font-family: ${SANS};
  }
  .side-btn:hover { background: ${MUTED_BG}; color: ${FG}; }
  .side-btn[aria-current="true"] { background: ${MUTED_BG}; color: ${FG}; font-weight: 600; }

  .btn-primary {
    background: ${PRIMARY}; color: #fafafa; border: none; border-radius: 6px;
    padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer;
    font-family: ${SANS}; width: 100%; margin-top: 6px; transition: background 0.15s;
  }
  .btn-primary:hover { background: #27272a; }

  .chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 7px; border-radius: 9999px;
    font-size: 11px; font-weight: 500; line-height: 1.4;
  }

  input:focus-visible, select:focus-visible, button:focus-visible {
    outline: 2px solid ${PRIMARY}; outline-offset: -1px;
  }
`
