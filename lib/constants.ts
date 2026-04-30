// ─────────────────────────────────────────────────────────────────────────────
// Costanti di design del sito MacrinoWeb.
// ─────────────────────────────────────────────────────────────────────────────

export const C = {
  // ── Background & text ──────────────────────────────────────────────────
  bg: '#FFFFFE',
  bgDark: '#0f1e2d',
  text: '#094067',
  textDark: '#FFFFFE',

  // ── Brand colors ───────────────────────────────────────────────────────
  primary: '#2273D4',
  primaryHover: '#1A5BB8',
  accent: '#3da9fc',
  secondary: '#2273d480',

  // ── Borders & UI elements ──────────────────────────────────────────────
  headerBorder: '#E5EEFF',
  menuBorder: '#E5EEFF',
  hamburgerBg: '#E5EEFF',

  // ── Effects (shadow, glow) ─────────────────────────────────────────────
  floatingShadow:
    '0 15px 35px rgba(34, 115, 212, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07)',
  ctaHoverShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.15)',

} as const