/**
 * Valori default del ribbon (produzione + seed per Leva in dev).
 */

export type HeroRibbonControls = {
  twistFrequencyX: number
  twistFrequencyY: number
  twistFrequencyZ: number
  twistPowerX: number
  twistPowerY: number
  twistPowerZ: number
  displaceFrequencyX: number
  displaceFrequencyZ: number
  displaceAmount: number
  displaceFrequencyY: number
  displaceFrequencyZ2: number
  displaceAmountPerp: number
  displaceAmountZ: number
  displaceFrequencyZD: number
  glowAmount: number
  glowPower: number
  glowRamp: number
  glowIntensity: number
  line2Count: number
  line2Width: number
  line2Opacity: number
  line2SpeedX: number
  line2AmpX: number
  line2SpeedY: number
  line2FreqY: number
  line2OpacitySpeed: number
  line2OpacityMin: number
  speed: number
  noiseStrength: number
  noiseFrequency: number
  noiseColorAtten: number
  parabolaPower: number
  colorSaturation: number
  colorContrast: number
  colorHueShift: number
  blurStr: number
  vignetteLeft: number
  vignetteBottom: number
  camFov: number
  camZ: number
  rotX: number
  rotY: number
  rotZ: number
  posX: number
  posY: number
  scale: number
}

export const HERO_RIBBON_CONTROL_DEFAULTS: HeroRibbonControls = {
  twistFrequencyX: -2.5,
  twistFrequencyY: 0.48,
  twistFrequencyZ: 0.89,
  twistPowerX: 2.65,
  twistPowerY: 0.55,
  twistPowerZ: 0.45,
  displaceFrequencyX: 1.22,
  displaceFrequencyZ: 0.5,
  displaceAmount: 0.33,
  displaceFrequencyY: 0.0,
  displaceFrequencyZ2: 0.0,
  displaceAmountPerp: 0.56,
  displaceAmountZ: 0.19,
  displaceFrequencyZD: 3.52,
  glowAmount: 1,
  glowPower: 0.7,
  glowRamp: 0.6,
  glowIntensity: 0.5,
  line2Count: 2,
  line2Width: 0.118,
  line2Opacity: 0.06,
  line2SpeedX: 0.19,
  line2AmpX: 0.5,
  line2SpeedY: 0.19,
  line2FreqY: 20,
  line2OpacitySpeed: 1.41,
  line2OpacityMin: 0.1,
  speed: 0.03,
  noiseStrength: 0.14,
  noiseFrequency: 205,
  noiseColorAtten: 0.2,
  parabolaPower: 7,
  colorSaturation: 1.95,
  colorContrast: 0.76,
  colorHueShift: 0.0,
  blurStr: 6,
  vignetteLeft: 0.1,
  vignetteBottom: 0.35,
  camFov: 26,
  camZ: 14.75,
  rotX: 1.95,
  rotY: 0.31,
  rotZ: -1.53,
  posX: -4.35,
  posY: -0.95,
  scale: 2.5,
}

export function cloneHeroRibbonDefaults(): HeroRibbonControls {
  return { ...HERO_RIBBON_CONTROL_DEFAULTS }
}
