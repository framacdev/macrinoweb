/**
 * Percorsi statici poster hero (`public/ribbon-fallback/`).
 * Nessuna API o scan: `<picture>` in `HeroSection` usa solo queste costanti.
 *
 * Breakpoint applicati in HeroSection:
 *   < 576px                                    → sportrait
 *   < 768px  OU  mobile landscape              → tablet
 *   768px – 1024px                             → lgtablet
 *   > 1024px                                   → desktop
 */

const BASE = '/ribbon-fallback' as const

// ── Small phone portrait (< 576px) ─────────────────────────────────────────
export const HERO_POSTER_SPORTRAIT_WEBP = `${BASE}/herocanvasposter-sportrait.webp`
export const HERO_POSTER_SPORTRAIT_PNG = `${BASE}/herocanvasposter-sportrait.png`

// ── Large phone portrait + mobile landscape (< 768px | landscape mobile) ───
export const HERO_POSTER_TABLET_WEBP = `${BASE}/herocanvasposter-tablet.webp`
export const HERO_POSTER_TABLET_PNG = `${BASE}/herocanvasposter-tablet.png`

// ── Tablet / laptop compatto (768px – 1024px) ───────────────────────────────
export const HERO_POSTER_LGTABLET_WEBP = `${BASE}/herocanvasposter-lgtablet.webp`
export const HERO_POSTER_LGTABLET_PNG = `${BASE}/herocanvasposter-lgtablet.png`

// ── Desktop (> 1024px) ──────────────────────────────────────────────────────
export const HERO_POSTER_DESKTOP_WEBP = `${BASE}/herocanvasposter-desktop.webp`
export const HERO_POSTER_DESKTOP_PNG = `${BASE}/herocanvasposter-desktop.png`
