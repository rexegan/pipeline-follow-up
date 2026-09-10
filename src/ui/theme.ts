/**
 * Design tokens carried over from Advisor Toolbox, whose palette was sampled
 * from the Client Intake "CatScan" workbook: steel-blue and rust section
 * banners, light-blue field labels, cream data rows, serif headings.
 *
 * The navy* keys are legacy names from that codebase (navy900 is white, not
 * navy) — kept as aliases so markup can move between the two apps unchanged.
 * Prefer the semantic names in new code.
 */
export const C = {
  // Semantic names
  page: '#ffffff',
  surface: '#ffffff',
  panel: '#eef4fa',
  labelFill: '#d8e8f0',
  divider: '#b9cbdd',

  // Legacy aliases from Advisor Toolbox
  navy900: '#ffffff',
  navy800: '#ffffff',
  navy700: '#eef4fa',
  navy600: '#d8e8f0',
  navy500: '#b9cbdd',

  accent: '#407098',
  accentHover: '#33597b',
  gold: '#b8860b',
  green: '#2e7d32',
  red: '#b03328',
  orange: '#ae5a24',
  purple: '#6b5b95',
  teal: '#2c7a7b',
  text: '#1a1a1a',
  muted: '#5a6472',
  border: 'rgba(16,24,40,0.14)',
  card: '#ffffff',
  cardHov: '#f8f0c8',

  bannerBlue: '#407098',
  bannerRust: '#ae5a24',
  labelBlue: '#d8e8f0',
  cream: '#f8f0c8',
} as const

export const FONT_HEAD = "Cambria, Georgia, 'Times New Roman', serif"

export const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: ${C.page}; color: ${C.text}; min-height: 100vh; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: ${C.panel}; }
  ::-webkit-scrollbar-thumb { background: ${C.divider}; border-radius: 2px; }
  input, textarea, select, button { font-family: inherit; }
  .fade-in { animation: fadeIn 0.2s ease; box-shadow: 0 1px 2px rgba(16,24,40,0.06); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .cat-banner { color: #ffffff; font-weight: 700; font-family: ${FONT_HEAD}; letter-spacing: 0.01em; }
  .stat-tile { cursor: pointer; transition: box-shadow 0.12s, transform 0.12s; }
  .stat-tile:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.14); transform: translateY(-2px); }
  .row-hover:hover { background: ${C.cream}; }
`
