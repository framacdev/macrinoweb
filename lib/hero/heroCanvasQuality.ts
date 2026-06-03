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

// WHY: variante mobile del tier massimo. Stessa densità di mesh del desktop
// (segmenti al cap, ~35k vertici), ma anti-aliasing via FXAA invece di MSAA 4×.
// Su GPU mobile a tile l'MSAA 4× su un render target full-screen a DPR 2 costa
// banda di memoria; FXAA è un singolo pass screen-space molto più economico.
// I segmenti restano al massimo: il vertex processing è triviale anche su mobile,
// il collo di bottiglia è il fill rate (DPR² × area × passi), non i vertici.
// È così che un flagship ottiene "massima risoluzione e segmenti" restando fluido.
const TIER_3_MOBILE: HeroCanvasQuality = {
  tier: 3,
  ...balancedTier(HERO_RIBBON_MAX_BALANCED_SEGMENTS),
  pixelRatioCap: 2,
  msaaSamples: 0,
  fxaa: true,
}

/**
 * Profilo per la cattura dei poster (route `/ribbon-capture`): massima densità
 * di mesh + MSAA 4× per il miglior anti-aliasing su un singolo frame statico,
 * e `pixelRatioCap: 1` perché il canvas è già renderizzato alla risoluzione
 * esatta del poster (il devicePixelRatio raddoppierebbe il buffer e i file).
 */
export const HERO_CAPTURE_QUALITY: HeroCanvasQuality = {
  tier: 3,
  ...balancedTier(HERO_RIBBON_MAX_BALANCED_SEGMENTS),
  pixelRatioCap: 1,
  msaaSamples: 4,
  fxaa: false,
}

function clampTier(n: number): HeroCanvasQualityTier {
  if (n <= 0) return 0
  if (n >= 3) return 3
  return n as HeroCanvasQualityTier
}

/**
 * Heuristica CPU/GPU/rete: nessuna dipendenza da Three.js (testabile).
 *
 * Principio: classifica per CAPACITÀ reale, non per "è touch". I touch device
 * NON vengono più declassati in blocco — un flagship mobile raggiunge il tier
 * massimo (mesh piena) come un desktop. La differenza desktop/mobile al top non
 * è la densità della mesh ma l'anti-aliasing: MSAA 4× su desktop, FXAA su touch
 * (vedi {@link TIER_3_MOBILE}). Il DPR cap a 2 protegge il fill rate ovunque.
 */
export function resolveHeroCanvasQuality(): HeroCanvasQuality {
  if (typeof window === 'undefined') return TIERS[1]

  const nav = navigator as NavigatorWithMemory
  const cores =
    typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 4
  // deviceMemory esiste solo su Chromium (Android / Chrome desktop). Su Safari
  // (iOS e macOS) è undefined → null: in quel caso NON penalizziamo, perché la
  // mancanza del segnale non deve declassare device Apple generalmente capaci.
  const mem = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null
  const dpr = window.devicePixelRatio || 1
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const saveData = nav.connection?.saveData === true
  const slowNet =
    nav.connection?.effectiveType === 'slow-2g' ||
    nav.connection?.effectiveType === '2g'

  // Risparmio dati o rete lentissima → minimo assoluto.
  if (saveData || slowNet) return TIERS[0]

  // mem ≤ 4 è il principale segnale anti-"octa-core economico": molti Android
  // budget riportano 8 core ma 3–4GB e GPU deboli, e verrebbero altrimenti
  // promossi per errore. dpr ≥ 3 è il segnale "device premium ad alta densità"
  // (flagship phone), che con ≥ 6 core sblocca il tier massimo anche su iOS,
  // dove deviceMemory non esiste e i core riportati sono 6.
  const lowMem = mem !== null && mem <= 4
  const veryLowMem = mem !== null && mem <= 2

  let idx: number
  if (cores <= 2 || veryLowMem) {
    idx = 0
  } else if (cores <= 4 || lowMem) {
    idx = 1
  } else if (cores >= 8 || (cores >= 6 && dpr >= 3)) {
    // Octa-core con RAM adeguata (desktop / flagship Android) oppure 6-core ad
    // alta densità (flagship iPhone / iPad Pro): tier massimo.
    idx = 3
  } else {
    // 6-core mainstream, tablet medi: tier alto senza MSAA.
    idx = 2
  }

  // prefers-reduced-motion: un grado di carico in meno (il ribbon resta, ma più
  // leggero). Per a11y piena valuta il freeze completo del ribbon (vedi nota).
  if (reducedMotion) idx -= 1

  const tier = clampTier(idx)

  // Al tier massimo su touch usa la variante mobile (FXAA invece di MSAA 4×):
  // mesh piena, ma senza il costo di banda dell'MSAA su GPU a tile.
  if (tier === 3 && coarse) return TIER_3_MOBILE
  return TIERS[tier]
}
