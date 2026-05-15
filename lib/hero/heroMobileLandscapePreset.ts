/**
 * Preset ribbon / vignetta per mobile landscape in produzione.
 * In dev i valori vengono applicati a Leva (vedi `HeroCanvas.dev.tsx`).
 */

export const MOBILE_LANDSCAPE_MQ =
  '(orientation: landscape) and (max-width: 1024px) and (pointer: coarse)' as const

export const MOBILE_LANDSCAPE_PRESET = {
  camZ: 7.05,
  posX: -4.2,
  posY: -0.95,
  scale: 1.8,
  vignetteLeft: 0.04,
  vignetteBottom: 0.15,
} as const
