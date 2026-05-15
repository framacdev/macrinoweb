/**
 * Percorsi statici poster hero (`public/textures/`).
 * Nessuna API o scan: `<picture>` in `HeroSection` usa solo queste costanti.
 */

const TEXTURES = '/textures' as const

/** Larghezze nei file `hero-canvas-poster-{w}.webp` (descrittori `w` in srcSet). */
export const HERO_CANVAS_POSTER_WIDTHS = [320, 640, 960] as const

/** Touch mobile: srcSet WebP responsive (`hero-canvas-poster-{w}.webp`). */
export const HERO_POSTER_MOBILE_TOUCH_WEBP_SRCSET =
  HERO_CANVAS_POSTER_WIDTHS.map(
    (w) => `${TEXTURES}/hero-canvas-poster-${w}.webp ${w}w`
  ).join(', ')

/** Desktop: WebP singolo (primario). */
export const HERO_POSTER_DESKTOP_WEBP = `${TEXTURES}/hero-canvas-poster.webp`

/** Desktop: PNG (secondario / `<img>`). */
export const HERO_POSTER_DESKTOP_PNG = `${TEXTURES}/hero-canvas-poster.png`

/** Mobile: PNG (secondario sotto `(pointer: coarse)`). */
export const HERO_POSTER_MOBILE_PNG = `${TEXTURES}/hero-canvas-mobile.png`
