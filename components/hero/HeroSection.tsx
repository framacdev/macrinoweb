'use client'

/**
 * HeroSection — poster da costanti statiche (`lib/hero/heroPosterSources.ts`).
 * HeroCanvas: `HeroCanvas.tsx` (dynamic, ssr: false).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  HERO_CANVAS_POSTER_WIDTHS,
  HERO_POSTER_DESKTOP_PNG,
  HERO_POSTER_DESKTOP_WEBP,
  HERO_POSTER_MOBILE_PNG,
  HERO_POSTER_MOBILE_TOUCH_WEBP_SRCSET,
} from '@/lib/hero/heroPosterSources'
import { hasWebGL } from '@/lib/hero/hasWebGL'

import HeroCanvas from './HeroCanvas'

const HERO_MOUNT_INSET = 'calc(-1 * 76px) 0 0 0' as const

const MOBILE_TOUCH_MEDIA = '(max-width: 1024px) and (pointer: coarse)' as const

export default function HeroSection() {
  const [posterHidden, setPosterHidden] = useState(false)
  const [showPoster, setShowPoster] = useState(true)
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setWebglSupported(hasWebGL())
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const onCanvasReady = useCallback(() => {
    setPosterHidden(true)
  }, [])

  const imgHintSize = useMemo(() => {
    const w = Math.max(...HERO_CANVAS_POSTER_WIDTHS)
    return { w, h: Math.round((w * 9) / 16) }
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        overflow: 'visible',
        backgroundColor: 'var(--color-bg)',
        transition: 'background-color 0.3s ease',
      }}
    >
      {showPoster ? (
        <picture
          style={{
            position: 'absolute',
            inset: HERO_MOUNT_INSET,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
            opacity: posterHidden ? 0 : 1,
            transition: 'opacity 0.55s ease',
          }}
        >
          <source
            type="image/webp"
            media={MOBILE_TOUCH_MEDIA}
            srcSet={HERO_POSTER_MOBILE_TOUCH_WEBP_SRCSET}
            sizes="100vw"
          />
          <source
            type="image/png"
            media={MOBILE_TOUCH_MEDIA}
            srcSet={`${HERO_POSTER_MOBILE_PNG} 1x`}
          />
          <source
            type="image/webp"
            media="(min-width: 1025px)"
            srcSet={`${HERO_POSTER_DESKTOP_WEBP} 1x`}
          />
          <img
            src={HERO_POSTER_DESKTOP_PNG}
            alt=""
            width={imgHintSize.w}
            height={imgHintSize.h}
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
            onError={() => setShowPoster(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: '50% 40%',
            }}
          />
        </picture>
      ) : null}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
        }}
      >
        {webglSupported === true ? (
          <HeroCanvas onCanvasReady={onCanvasReady} />
        ) : null}
      </div>
    </section>
  )
}
