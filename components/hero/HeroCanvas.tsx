'use client'

/**
 * Entry hero WebGL: in dev carica Leva + `HeroCanvasCore`, in prod solo default statici.
 * Shader / post / mesh tier: `lib/hero/heroRibbonShaders.ts`, `heroRibbonRadialBlur.ts`, `heroCanvasQuality.ts`.
 */

import dynamic from 'next/dynamic'

export type { HeroCanvasProps } from './HeroCanvasCore'

const HeroCanvasRoot = dynamic(
  () =>
    process.env.NODE_ENV === 'development'
      ? import('./HeroCanvas.dev')
      : import('./HeroCanvas.prod'),
  { ssr: false, loading: () => null }
)

export default HeroCanvasRoot
