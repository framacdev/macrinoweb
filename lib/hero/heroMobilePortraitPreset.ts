/**
 * Preset ribbon per mobile portrait stretto (< 576px).
 * Applicato in prod via tick() e in dev via onMobilePortraitMatchChange → Leva.
 *
 * Solo camFov e posX sono sovrascitti; gli altri valori restano ai default.
 */

export const MOBILE_PORTRAIT_MQ = '(max-width: 575px)' as const

export const MOBILE_PORTRAIT_PRESET = {
  camFov: 20,
  posX: -5,
} as const
