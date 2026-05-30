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
import { hasWebGL } from '@/lib/hero/hasWebGL'

import HeroCanvas from './HeroCanvas'
import HeroContent from './HeroContent'

// WHY: media query del poster di fallback "tablet" — phone portrait ≤ 767px
// OPPURE phone landscape (orientation + pointer coarse, ≤ 1024px). La stringa
// landscape vive qui perché, rimossi i preset ribbon per-breakpoint, questo
// <picture> è il suo unico consumer. La virgola CSS è un OR fra i due casi.
const MOBILE_LANDSCAPE_MQ =
  '(orientation: landscape) and (max-width: 1024px) and (pointer: coarse)' as const
const TABLET_MEDIA = `(max-width: 767px), ${MOBILE_LANDSCAPE_MQ}` as const

export default function HeroSection() {
  const [posterHidden, setPosterHidden] = useState(false)
  const [showPoster, setShowPoster] = useState(true)
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)

  useEffect(() => {
    // WHY: il check WebGL gira dopo il primo RAF (un frame dopo l'hydration)
    // così il canvas monta solo client-side. L'altezza della hero NON è più
    // misurata in JS: è pilotata interamente da --hero-h (globals.css), che
    // sotto i 1024px è un valore fisso in px immune alla URL bar mobile —
    // più solido del vecchio window.innerHeight, senza flash né listener.
    const id = window.requestAnimationFrame(() => {
      setWebglSupported(hasWebGL())
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const onCanvasReady = useCallback(() => {
    setPosterHidden(true)
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        // WHY: altezza pilotata da --hero-h (globals.css): 100dvh su desktop,
        // 700px portrait / 600px landscape sotto i 1024px. Risolta già a SSR
        // dalla CSS var → nessun hydration mismatch e nessun flash.
        height: 'var(--hero-h)',
        backgroundColor: 'var(--color-bg)',
        transition: 'background-color 0.3s ease',
      }}
    >
      {showPoster ? (
        <picture
          style={{
            position: 'absolute',
            inset: 'calc(-1 * var(--hero-nav-h)) 0 0 0',
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
      {/* WHY: isolation:isolate racchiude canvas, overlay e contenuto nello stesso
          stacking context. Il mix-blend-mode del paragrafo (HeroContent) si fonde
          coi pixel del ribbon dipinti nello stesso contesto, mentre isolation:isolate
          confina il blend a questo gruppo senza influenzare il resto della pagina.
          L'ordine DOM (canvas → overlay → contenuto) definisce l'ordine di pittura
          senza z-index interni, che creerebbero stacking context isolati e
          interromperebbero il blend. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          isolation: 'isolate',
        }}
      >
        {/* WHY: la section ha già la sua altezza --hero-h (CSS) al primo paint,
            quindi quando HeroCanvasCore legge mount.clientHeight al mount il
            valore è corretto. Su rotazione il window 'resize' fa rileggere la
            nuova clientHeight (700↔600) tramite executeResize in HeroCanvasCore. */}
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {webglSupported === true ? (
            <HeroCanvas onCanvasReady={onCanvasReady} />
          ) : null}
        </div>

        {/* WHY: UNICO overlay di wash del sito. Sfuma il ribbon verso --color-bg
            nell'angolo in alto a sinistra, staccando badge, H1 e bottoni. Il
            bleed di --hero-nav-h (come poster e mount div del canvas) lo fa
            salire ANCHE dietro l'header: con la card dell'header trasparente a
            riposo, header e hero condividono questo stesso gradient continuo,
            senza un secondo overlay da accendere/spegnere. Sta sopra il canvas e
            sotto tutta la UI (ordine DOM), quindi tinge solo il ribbon. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            // WHY: stesso inset di poster e mount div del canvas → il wash copre
            // la fascia dietro la navbar e parte dal vero angolo (0,0) di pagina.
            inset: 'calc(-1 * var(--hero-nav-h)) 0 0 0',
            height: '100%',
            background:
              'linear-gradient(to bottom right, var(--color-bg) 0%, transparent 45%)',
            pointerEvents: 'none',
          }}
        />

        {/* Contenuto hero — badge, h1, paragrafo, bottoni */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <HeroContent />
        </div>
      </div>
    </section>
  )
}
