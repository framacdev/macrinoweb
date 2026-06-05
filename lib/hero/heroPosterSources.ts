/**
 * Percorsi statici poster hero (`public/ribbon-fallback/`).
 * Nessuna API o scan: `<picture>` in `HeroSection` usa solo queste costanti.
 *
 * Formati per breakpoint: AVIF (primario, ~metà dei byte) → WebP (fallback per
 * Safari < 16.4) → PNG come `<img>` ultimo fallback (solo desktop). I file sono
 * pre-generati dai master PNG con sharp (qualità alta, statici → portabili su
 * qualsiasi host, niente ottimizzazione runtime).
 *
 * Breakpoint applicati in HeroSection (prima corrispondenza vince):
 *   landscape & ≤ 1024px                       → landscape
 *   < 576px (portrait)                         → sportrait
 *   < 768px (portrait)                         → tablet
 *   768px – 1024px (portrait)                  → lgtablet
 *   > 1024px                                   → desktop
 */

const BASE = '/ribbon-fallback' as const

// ── Mobile landscape (orientation landscape & ≤ 1024px) ─────────────────────
// Poster dedicato ad aspect largo: il tablet quadrato, in cover su un box
// landscape, risultava zoomato e non combaciava col ribbon live.
export const HERO_POSTER_LANDSCAPE_AVIF = `${BASE}/herocanvasposter-landscape.avif`
export const HERO_POSTER_LANDSCAPE_WEBP = `${BASE}/herocanvasposter-landscape.webp`

// ── Small phone portrait (< 576px) ─────────────────────────────────────────
export const HERO_POSTER_SPORTRAIT_AVIF = `${BASE}/herocanvasposter-sportrait.avif`
export const HERO_POSTER_SPORTRAIT_WEBP = `${BASE}/herocanvasposter-sportrait.webp`

// ── Large phone portrait + mobile landscape (< 768px | landscape mobile) ───
export const HERO_POSTER_TABLET_AVIF = `${BASE}/herocanvasposter-tablet.avif`
export const HERO_POSTER_TABLET_WEBP = `${BASE}/herocanvasposter-tablet.webp`

// ── Tablet / laptop compatto (768px – 1024px) ───────────────────────────────
export const HERO_POSTER_LGTABLET_AVIF = `${BASE}/herocanvasposter-lgtablet.avif`
export const HERO_POSTER_LGTABLET_WEBP = `${BASE}/herocanvasposter-lgtablet.webp`

// ── Desktop (> 1024px) ──────────────────────────────────────────────────────
export const HERO_POSTER_DESKTOP_AVIF = `${BASE}/herocanvasposter-desktop.avif`
export const HERO_POSTER_DESKTOP_WEBP = `${BASE}/herocanvasposter-desktop.webp`
// PNG: solo come ultimo fallback `<img>` (browser senza AVIF né WebP ≈ 0%).
export const HERO_POSTER_DESKTOP_PNG = `${BASE}/herocanvasposter-desktop.png`
