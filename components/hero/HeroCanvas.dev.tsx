'use client'

import { useControls, folder, levaStore } from 'leva'
import { useCallback, useEffect, useRef } from 'react'

import { HERO_RIBBON_CONTROL_DEFAULTS } from '@/lib/hero/heroControlDefaults'
import { MOBILE_LANDSCAPE_PRESET } from '@/lib/hero/heroMobileLandscapePreset'

import { HeroCanvasCore, type HeroCanvasProps } from './HeroCanvasCore'

const d = HERO_RIBBON_CONTROL_DEFAULTS

/**
 * Full Leva store paths for every key touched by the mobile-landscape preset.
 * Format: "<FolderName>.<keyName>" — mirrors exactly the folder/key names below.
 * levaStore.getInput(path) returns undefined when Leva has disposed those paths
 * (unmount / remount cycle), so we abort before calling setControls.
 */
const ML_GUARD_PATHS = [
  'Camera & Posizione.camZ',
  'Camera & Posizione.posX',
  'Camera & Posizione.posY',
  'Camera & Posizione.scale',
  'Vignetta Blur (bordi).vignetteLeft',
  'Vignetta Blur (bordi).vignetteBottom',
] as const

export default function HeroCanvasDev(props: HeroCanvasProps) {
  const [controls, setControls] = useControls(
    () => ({
      'Twist (3 assi)': folder({
        twistFrequencyX: {
          label: 'Frequency X',
          value: d.twistFrequencyX,
          min: -3,
          max: 3,
          step: 0.01,
        },
        twistFrequencyY: {
          label: 'Frequency Y',
          value: d.twistFrequencyY,
          min: -3,
          max: 3,
          step: 0.01,
        },
        twistFrequencyZ: {
          label: 'Frequency Z',
          value: d.twistFrequencyZ,
          min: -3,
          max: 3,
          step: 0.01,
        },
        twistPowerX: {
          label: 'Power X',
          value: d.twistPowerX,
          min: 0.1,
          max: 8,
          step: 0.05,
        },
        twistPowerY: {
          label: 'Power Y',
          value: d.twistPowerY,
          min: 0.1,
          max: 8,
          step: 0.05,
        },
        twistPowerZ: {
          label: 'Power Z',
          value: d.twistPowerZ,
          min: 0.1,
          max: 8,
          step: 0.05,
        },
      }),
      'Pieghe Longitudinali (larghezza)': folder({
        displaceFrequencyX: {
          label: 'Freq X (cross-section)',
          value: d.displaceFrequencyX,
          min: 0,
          max: 8,
          step: 0.01,
        },
        displaceFrequencyZ: {
          label: 'Freq Z (profondità)',
          value: d.displaceFrequencyZ,
          min: 0,
          max: 8,
          step: 0.01,
        },
        displaceAmount: {
          label: 'Intensità',
          value: d.displaceAmount,
          min: 0,
          max: 3,
          step: 0.005,
        },
      }),
      'Pieghe Perpendicolari (lunghezza)': folder({
        displaceFrequencyY: {
          label: 'Freq Y (lunghezza)',
          value: d.displaceFrequencyY,
          min: 0,
          max: 8,
          step: 0.01,
        },
        displaceFrequencyZ2: {
          label: 'Freq Z2 (profondità)',
          value: d.displaceFrequencyZ2,
          min: 0,
          max: 8,
          step: 0.01,
        },
        displaceAmountPerp: {
          label: 'Intensità',
          value: d.displaceAmountPerp,
          min: 0,
          max: 3,
          step: 0.005,
        },
      }),
      'Pieghe in Profondità (Z)': folder({
        displaceAmountZ: {
          label: 'Intensità',
          value: d.displaceAmountZ,
          min: 0,
          max: 3,
          step: 0.01,
        },
        displaceFrequencyZD: {
          label: 'Frequenza',
          value: d.displaceFrequencyZD,
          min: 0.1,
          max: 5,
          step: 0.01,
        },
      }),
      'Glow su Creste': folder({
        glowAmount: {
          label: 'Amount (selettività)',
          value: d.glowAmount,
          min: 0,
          max: 10,
          step: 0.05,
        },
        glowPower: {
          label: 'Power (nettezza bordi)',
          value: d.glowPower,
          min: 0.1,
          max: 8,
          step: 0.05,
        },
        glowRamp: {
          label: 'Ramp (soglia)',
          value: d.glowRamp,
          min: 0.01,
          max: 2,
          step: 0.01,
        },
        glowIntensity: {
          label: 'Intensità bianco',
          value: d.glowIntensity,
          min: 0,
          max: 1,
          step: 0.01,
        },
      }),
      'Linee di Luce B': folder({
        line2Count: {
          label: 'Quantità',
          value: d.line2Count,
          min: 0,
          max: 8,
          step: 1,
        },
        line2Width: {
          label: 'Larghezza / Blur',
          value: d.line2Width,
          min: 0.001,
          max: 0.15,
          step: 0.001,
        },
        line2Opacity: {
          label: 'Opacità base',
          value: d.line2Opacity,
          min: 0,
          max: 3.0,
          step: 0.01,
        },
        line2SpeedX: {
          label: 'Velocità laterale',
          value: d.line2SpeedX,
          min: 0,
          max: 3.0,
          step: 0.01,
        },
        line2AmpX: {
          label: 'Ampiezza laterale',
          value: d.line2AmpX,
          min: 0,
          max: 0.5,
          step: 0.005,
        },
        line2SpeedY: {
          label: 'Velocità ondeggiamento',
          value: d.line2SpeedY,
          min: 0,
          max: 3.0,
          step: 0.01,
        },
        line2FreqY: {
          label: 'Frequenza ondeggiamento',
          value: d.line2FreqY,
          min: 0,
          max: 20.0,
          step: 0.1,
        },
        line2OpacitySpeed: {
          label: 'Velocità pulsazione',
          value: d.line2OpacitySpeed,
          min: 0,
          max: 5.0,
          step: 0.01,
        },
        line2OpacityMin: {
          label: 'Opacità minima [0–1]',
          value: d.line2OpacityMin,
          min: 0,
          max: 1.0,
          step: 0.01,
        },
      }),
      'Velocità Globale': folder({
        speed: {
          label: 'Speed (animazione)',
          value: d.speed,
          min: 0,
          max: 3,
          step: 0.01,
        },
      }),
      'Surface Noise': folder({
        noiseStrength: {
          label: 'Strength',
          value: d.noiseStrength,
          min: 0,
          max: 2,
          step: 0.005,
        },
        noiseFrequency: {
          label: 'Frequency',
          value: d.noiseFrequency,
          min: 50,
          max: 2000,
          step: 5,
        },
        noiseColorAtten: {
          label: 'Color Attenuation',
          value: d.noiseColorAtten,
          min: 0,
          max: 1,
          step: 0.01,
        },
        parabolaPower: {
          label: 'Parabola Power',
          value: d.parabolaPower,
          min: 0.5,
          max: 8,
          step: 0.05,
        },
      }),
      'Color Grading': folder({
        colorSaturation: {
          label: 'Saturation',
          value: d.colorSaturation,
          min: 0,
          max: 2,
          step: 0.01,
        },
        colorContrast: {
          label: 'Contrast',
          value: d.colorContrast,
          min: 0,
          max: 2,
          step: 0.01,
        },
        colorHueShift: {
          label: 'Hue Shift',
          value: d.colorHueShift,
          min: -3.14159,
          max: 3.14159,
          step: 0.01,
        },
      }),
      'Vignetta Blur (bordi)': folder({
        blurStr: {
          label: 'Intensità blur',
          value: d.blurStr,
          min: 0,
          max: 30,
          step: 0.1,
        },
        vignetteLeft: {
          label: 'Estensione sinistra',
          value: d.vignetteLeft,
          min: 0,
          max: 1.0,
          step: 0.01,
        },
        vignetteBottom: {
          label: 'Estensione bottom',
          value: d.vignetteBottom,
          min: 0,
          max: 1.0,
          step: 0.01,
        },
      }),
      'Camera & Posizione': folder({
        camFov: { label: 'FOV', value: d.camFov, min: 20, max: 120, step: 1 },
        camZ: { label: 'Camera Z', value: d.camZ, min: 1, max: 20, step: 0.05 },
        rotX: {
          label: 'Rotazione X',
          value: d.rotX,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
        },
        rotY: {
          label: 'Rotazione Y',
          value: d.rotY,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
        },
        rotZ: {
          label: 'Rotazione Z',
          value: d.rotZ,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
        },
        posX: {
          label: 'Posizione X',
          value: d.posX,
          min: -5,
          max: 5,
          step: 0.05,
        },
        posY: {
          label: 'Posizione Y',
          value: d.posY,
          min: -5,
          max: 5,
          step: 0.05,
        },
        scale: { label: 'Scala', value: d.scale, min: 0.1, max: 5, step: 0.05 },
      }),
    }),
    []
  )

  const ctrlRef = useRef(controls)
  useEffect(() => {
    ctrlRef.current = controls
  }, [controls])

  const onMobileLandscapeMatchChange = useCallback(
    (matches: boolean) => {
      // Abort if Leva has disposed any of the affected paths (unmount/remount cycle).
      // levaStore.getInput returns undefined for paths not currently registered.
      if (ML_GUARD_PATHS.some((p) => levaStore.getInput(p) === undefined))
        return

      if (matches) {
        setControls({
          camZ: MOBILE_LANDSCAPE_PRESET.camZ,
          posX: MOBILE_LANDSCAPE_PRESET.posX,
          posY: MOBILE_LANDSCAPE_PRESET.posY,
          scale: MOBILE_LANDSCAPE_PRESET.scale,
          vignetteLeft: MOBILE_LANDSCAPE_PRESET.vignetteLeft,
          vignetteBottom: MOBILE_LANDSCAPE_PRESET.vignetteBottom,
        })
        return
      }
      setControls({
        camZ: d.camZ,
        posX: d.posX,
        posY: d.posY,
        scale: d.scale,
        vignetteLeft: d.vignetteLeft,
        vignetteBottom: d.vignetteBottom,
      })
    },
    [setControls]
  )

  return (
    <HeroCanvasCore
      {...props}
      ctrlRef={ctrlRef}
      onMobileLandscapeMatchChange={onMobileLandscapeMatchChange}
    />
  )
}
