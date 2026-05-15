/**
 * Risolve qualità rendering per HeroCanvas (mesh, DPR, MSAA).
 * Unico punto di verità per tiering: evita magic numbers sparsi nel componente.
 *
 * Mesh: segmenti **uguali** su cross e along (UV.x / UV.y hanno pari peso).
 * Vertici = (segments + 1)². Cap massimo 35k → segments ≤ 186 perché
 * 187² = 34_969, 188² > 35k.
 */

export const HERO_RIBBON_VERTEX_CAP = 35_000 as const

/** Massimo segmenti per asse con griglia quadrata sotto {@link HERO_RIBBON_VERTEX_CAP}. */
export const HERO_RIBBON_MAX_BALANCED_SEGMENTS =
  Math.floor(Math.sqrt(HERO_RIBBON_VERTEX_CAP)) - 1

export type HeroCanvasQualityTier = 0 | 1 | 2 | 3

export type HeroCanvasQuality = {
  tier: HeroCanvasQualityTier
  /** PlaneGeometry widthSegments (UV.x); uguale a `ribbonSegmentsAlong`. */
  ribbonSegmentsCross: number
  /** PlaneGeometry heightSegments (UV.y); uguale a `ribbonSegmentsCross`. */
  ribbonSegmentsAlong: number
  /** Limite superiore a devicePixelRatio per il renderer */
  pixelRatioCap: number
  /** Campioni MSAA sul render target dell'EffectComposer (0 = disattivo) */
  msaaSamples: 0 | 4
  /** Aggiunge un pass FXAA screen-space dopo il RenderPass (tier senza MSAA) */
  fxaa: boolean
}

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean; effectiveType?: string }
}

function balancedTier(
  segments: number
): Pick<HeroCanvasQuality, 'ribbonSegmentsCross' | 'ribbonSegmentsAlong'> {
  const s = Math.min(segments, HERO_RIBBON_MAX_BALANCED_SEGMENTS)
  return { ribbonSegmentsCross: s, ribbonSegmentsAlong: s }
}

const TIERS: readonly HeroCanvasQuality[] = [
  {
    tier: 0,
    ...balancedTier(48),
    pixelRatioCap: 1,
    msaaSamples: 0,
    fxaa: true,
  },
  {
    tier: 1,
    ...balancedTier(84),
    pixelRatioCap: 1.5,
    msaaSamples: 0,
    fxaa: true,
  },
  {
    tier: 2,
    ...balancedTier(132),
    pixelRatioCap: 2,
    msaaSamples: 0,
    fxaa: true,
  },
  {
    tier: 3,
    ...balancedTier(HERO_RIBBON_MAX_BALANCED_SEGMENTS),
    pixelRatioCap: 2,
    msaaSamples: 4,
    fxaa: false,
  },
] as const

function clampTier(n: number): HeroCanvasQualityTier {
  if (n <= 0) return 0
  if (n >= 3) return 3
  return n as HeroCanvasQualityTier
}

/**
 * Heuristica CPU/GPU/batteria: nessuna dipendenza da Three.js (testabile).
 */
export function resolveHeroCanvasQuality(): HeroCanvasQuality {
  if (typeof window === 'undefined') return TIERS[1]

  const nav = navigator as NavigatorWithMemory
  const cores =
    typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 4
  const memGiB = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 8
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const saveData = nav.connection?.saveData === true
  const slowNet =
    nav.connection?.effectiveType === 'slow-2g' ||
    nav.connection?.effectiveType === '2g'

  let idx = 2
  if (cores >= 8 && memGiB >= 8) idx = 3
  else if (cores <= 4 || memGiB <= 4) idx = 1
  if (cores <= 2 || memGiB <= 2) idx = 0

  if (coarse) idx -= 1
  if (saveData || slowNet) idx -= 1
  if (reducedMotion) idx -= 1

  return TIERS[clampTier(idx)]
}
