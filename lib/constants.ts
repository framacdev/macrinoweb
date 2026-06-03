// ─────────────────────────────────────────────────────────────────────────────
// Costanti di design del sito MacrinoWeb.
// ─────────────────────────────────────────────────────────────────────────────

// Solo i valori letti a runtime dal JS restano qui: il resto della palette vive
// nelle CSS variables (globals.css), che cambiano tema prima dell'hydration.
export const C = {
  // ── Text ───────────────────────────────────────────────────────────────
  text: '#094067',
  textDark: '#FFFFFE',

  // ── Brand colors ───────────────────────────────────────────────────────
  primary: '#2273D4',
  primaryHover: '#1A5BB8',
  accent: '#3da9fc',
  // hover del primary in dark mode (lì il fill è l'accent). Vedi primaryButtonStyle.
  accentHover: '#2a9ae8',
  secondary: '#2273d480',

  // ── Borders ────────────────────────────────────────────────────────────
  headerBorder: '#E5EEFF',
  menuBorder: '#E5EEFF',

  // ── Effects ────────────────────────────────────────────────────────────
  floatingShadow:
    '0 15px 35px rgba(34, 115, 212, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07)',
} as const
