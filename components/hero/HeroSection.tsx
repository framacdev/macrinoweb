'use client'

/**
 * HeroSection — poster da costanti statiche (`lib/hero/heroPosterSources.ts`).
 * HeroCanvas: `HeroCanvas.tsx` (dynamic, ssr: false).
 */

import { useCallback, useEffect, useState } from 'react'

import {
  HERO_POSTER_DESKTOP_PNG,
  HERO_POSTER_DESKTOP_WEBP,
  HERO_POSTER_LGTABLET_PNG,
  HERO_POSTER_LGTABLET_WEBP,
  HERO_POSTER_SPORTRAIT_PNG,
  HERO_POSTER_SPORTRAIT_WEBP,
  HERO_POSTER_TABLET_PNG,
  HERO_POSTER_TABLET_WEBP,
} from '@/lib/hero/heroPosterSources'
import { MOBILE_LANDSCAPE_MQ } from '@/lib/hero/heroMobileLandscapePreset'
import { hasWebGL } from '@/lib/hero/hasWebGL'

import HeroCanvas from './HeroCanvas'

const HERO_MOUNT_INSET = 'calc(-1 * 76px) 0 0 0' as const

// WHY: riusa MOBILE_LANDSCAPE_MQ già definita in heroMobileLandscapePreset
// anziché duplicare la stringa. La virgola CSS (OR) combina i due casi:
// phone portrait 576–767px  OU  phone landscape con pointer coarse ≤ 1024px.
const TABLET_MEDIA = `(max-width: 767px), ${MOBILE_LANDSCAPE_MQ}` as const

export default function HeroSection() {
  const [posterHidden, setPosterHidden] = useState(false)
  const [showPoster, setShowPoster] = useState(true)
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)
  // WHY: undefined = pre-hydration (SSR usa '100dvh'). Dopo il primo RAF
  // viene fissato a window.innerHeight px e non cambia mai più, replicando
  // il comportamento di Stripe (hero height fissa, immune a resize verticale
  // e alla URL bar mobile che appare/scompare).
  const [heroHeight, setHeroHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      // WHY: setWebglSupported e setHeroHeight nello stesso RAF callback →
      // React 18 li batcha in un unico re-render. Il canvas monta già con
      // la section alla sua altezza definitiva, evitando un'inizializzazione
      // a 100dvh che poi non verrebbe mai aggiornata.
      setWebglSupported(hasWebGL())
      setHeroHeight(window.innerHeight)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      // WHY: orientationchange (e screen.orientation 'change') fires PRIMA
      // che il browser aggiorni window.innerHeight con le nuove dimensioni
      // post-rotazione. 100ms è sufficiente su iOS e Android per leggere
      // il valore finale stabile. Il window 'resize' che segue la rotazione
      // fa scattare executeResize in HeroCanvasCore (150ms debounce), che
      // leggerà mount.clientHeight già aggiornato da questo setState.
      setTimeout(() => setHeroHeight(window.innerHeight), 100)
    }

    // screen.orientation.change è l'API moderna (Chrome/Firefox/Safari ≥ 16.4).
    // 'orientationchange' su window è il fallback legacy (Safari < 16.4, WebView).
    if (typeof screen.orientation !== 'undefined') {
      screen.orientation.addEventListener('change', updateHeight)
      return () =>
        screen.orientation.removeEventListener('change', updateHeight)
    }
    window.addEventListener('orientationchange', updateHeight)
    return () => window.removeEventListener('orientationchange', updateHeight)
  }, [])

  const onCanvasReady = useCallback(() => {
    setPosterHidden(true)
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        // WHY: '100dvh' come fallback SSR (nessun hydration mismatch).
        // Dopo il RAF viene sostituito con window.innerHeight px fissi:
        // da quel momento l'altezza è immune a qualsiasi resize successivo.
        height: heroHeight !== undefined ? `${heroHeight}px` : '100dvh',
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
          {/* ── < 576px — phone portrait piccolo ─────────────────────────── */}
          <source
            type="image/webp"
            media="(max-width: 575px)"
            srcSet={HERO_POSTER_SPORTRAIT_WEBP}
          />
          <source
            type="image/png"
            media="(max-width: 575px)"
            srcSet={HERO_POSTER_SPORTRAIT_PNG}
          />

          {/* ── < 768px OU mobile landscape — phone portrait medio + landscape ── */}
          <source
            type="image/webp"
            media={TABLET_MEDIA}
            srcSet={HERO_POSTER_TABLET_WEBP}
          />
          <source
            type="image/png"
            media={TABLET_MEDIA}
            srcSet={HERO_POSTER_TABLET_PNG}
          />

          {/* ── 768px – 1024px — tablet / laptop compatto ────────────────── */}
          <source
            type="image/webp"
            media="(max-width: 1024px)"
            srcSet={HERO_POSTER_LGTABLET_WEBP}
          />
          <source
            type="image/png"
            media="(max-width: 1024px)"
            srcSet={HERO_POSTER_LGTABLET_PNG}
          />

          {/* ── > 1024px — desktop (PNG via <img> fallback per browser vecchi) ─ */}
          <source type="image/webp" srcSet={HERO_POSTER_DESKTOP_WEBP} />
          <img
            src={HERO_POSTER_DESKTOP_PNG}
            alt=""
            width={1920}
            height={1080}
            decoding="async"
            fetchPriority="high"
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
        {/* WHY: heroHeight !== undefined garantisce che la section sia già
            alla sua altezza fissa quando HeroCanvasCore legge mount.clientHeight
            al mount — evita un'inizializzazione del renderer all'altezza 100dvh. */}
        {webglSupported === true && heroHeight !== undefined ? (
          <HeroCanvas onCanvasReady={onCanvasReady} />
        ) : null}
      </div>
    </section>
  )
}
