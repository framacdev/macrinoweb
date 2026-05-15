'use client'

import { useRef } from 'react'

import { cloneHeroRibbonDefaults } from '@/lib/hero/heroControlDefaults'

import { HeroCanvasCore, type HeroCanvasProps } from './HeroCanvasCore'

export default function HeroCanvasProd(props: HeroCanvasProps) {
  const ctrlRef = useRef(cloneHeroRibbonDefaults())
  return <HeroCanvasCore {...props} ctrlRef={ctrlRef} />
}
