'use client'

/**
 * HeroSection — poster da costanti statiche (`lib/hero/heroPosterSources.ts`).
 * HeroCanvas: `HeroCanvas.tsx` (dynamic, ssr: false).
 */

import { useCallback, useEffect, useState } from 'react'

import {
  HERO_POSTER_DESKTOP_AVIF,
  HERO_POSTER_DESKTOP_WEBP,
  HERO_POSTER_LANDSCAPE_AVIF,
  HERO_POSTER_LANDSCAPE_WEBP,
  HERO_POSTER_LGTABLET_AVIF,
  HERO_POSTER_LGTABLET_WEBP,
  HERO_POSTER_SPORTRAIT_AVIF,
  HERO_POSTER_SPORTRAIT_WEBP,
  HERO_POSTER_TABLET_AVIF,
  HERO_POSTER_TABLET_WEBP,
} from '@/lib/hero/heroPosterSources'
import { hasWebGL } from '@/lib/hero/hasWebGL'

import HeroCanvas from './HeroCanvas'
import HeroContent from './HeroContent'

// WHY: media query dei poster di fallback. Il landscape mobile ha ora un poster
// DEDICATO (aspect largo) invece di riusare quello tablet quadrato, che in cover
// su un box landscape risultava zoomato e non combaciava col ribbon live. Stessa
// soglia della media query d'altezza in globals.css (≤1024 + landscape) per
// coerenza. La source landscape va per prima nel <picture> (prima-corrispondenza).
const LANDSCAPE_MEDIA =
  '(orientation: landscape) and (max-width: 1024px)' as const
const TABLET_MEDIA = '(max-width: 767px)' as const

export default function HeroSection() {
  const [posterHidden, setPosterHidden] = useState(false)
  const [showPoster, setShowPoster] = useState(true)
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)

  useEffect(() => {
    // WHY: il check WebGL gira dopo il primo RAF (un frame dopo l'hydration)
    // così il canvas monta solo client-side. L'altezza della hero non è misurata
    // in JS: la section usa min-height:var(--hero-h) e cresce col contenuto; il
    // canvas (assoluto, inset:0) si adatta sempre all'altezza reale via resize.
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
        // WHY: min-height (non height) — la hero riempie il viewport quando il
        // contenuto è corto, ma CRESCE quando il copy supera il viewport (mobile
        // landscape), così non trabocca mai. 100svh = viewport "piccolo" (URL bar
        // mostrata): riempie senza il reflow del canvas quando la barra mobile
        // compare/sparisce. Altezza reale = max(100svh, contenuto in-flow).
        minHeight: 'var(--hero-h)',
        backgroundColor: 'var(--color-bg)',
        // WHY: nessuna transition sul background-color — la section è coperta da
        // ribbon/wash/canvas, quindi il cambio istantaneo è invisibile. La transition
        // causava un flash bianco→scuro (300ms animato) in dark mode al page load,
        // quando il browser calcolava i primi stili PRIMA che next-themes applicasse
        // .dark e il transition si innescava. html,body in globals.css gestisce la
        // transizione del background per il resto della pagina.
        // WHY: isolation:isolate fa della section il contesto di stacking del
        // blend. Poster, canvas e overlay stanno a z-index:-1; il contenuto è
        // in-flow (z-auto) e si dipinge sopra. Il mix-blend-mode:multiply del
        // paragrafo (HeroContent) fonde così col ribbon dietro, dentro questo
        // contesto isolato e senza propagare il blend al resto della pagina.
        isolation: 'isolate',
      }}
    >
      {showPoster ? (
        <picture
          style={{
            position: 'absolute',
            // top:-nav → bleed dietro la navbar; bottom:0 (da inset) → fino al
            // fondo della section. Niente height:100% (sarebbe over-constrained).
            inset: 'calc(-1 * var(--hero-nav-h)) 0 0 0',
            zIndex: -1,
            pointerEvents: 'none',
            opacity: posterHidden ? 0 : 1,
            transition: 'opacity 0.55s ease',
          }}
        >
          {/* WHY ordine: per ogni breakpoint AVIF prima di WebP → il browser
              prende AVIF se supportato (Safari 16.4+, tutti gli altri moderni),
              altrimenti WebP. Il PNG resta solo come <img> finale. */}

          {/* ── landscape mobile (≤1024px) — poster dedicato, aspect largo ── */}
          <source
            type="image/avif"
            media={LANDSCAPE_MEDIA}
            srcSet={HERO_POSTER_LANDSCAPE_AVIF}
          />
          <source
            type="image/webp"
            media={LANDSCAPE_MEDIA}
            srcSet={HERO_POSTER_LANDSCAPE_WEBP}
          />

          {/* ── < 576px — phone portrait piccolo ─────────────────────────── */}
          <source
            type="image/avif"
            media="(max-width: 575px)"
            srcSet={HERO_POSTER_SPORTRAIT_AVIF}
          />
          <source
            type="image/webp"
            media="(max-width: 575px)"
            srcSet={HERO_POSTER_SPORTRAIT_WEBP}
          />

          {/* ── < 768px — phone portrait medio ─────────────────────────── */}
          <source
            type="image/avif"
            media={TABLET_MEDIA}
            srcSet={HERO_POSTER_TABLET_AVIF}
          />
          <source
            type="image/webp"
            media={TABLET_MEDIA}
            srcSet={HERO_POSTER_TABLET_WEBP}
          />

          {/* ── 768px – 1024px — tablet / laptop compatto ────────────────── */}
          <source
            type="image/avif"
            media="(max-width: 1024px)"
            srcSet={HERO_POSTER_LGTABLET_AVIF}
          />
          <source
            type="image/webp"
            media="(max-width: 1024px)"
            srcSet={HERO_POSTER_LGTABLET_WEBP}
          />

          {/* ── > 1024px — desktop. L'<img> (src = WebP) è anche l'elemento
              renderizzato; le <source> sopra lo sovrascrivono nei browser con
              <picture>. onError nasconde il poster se anche il WebP fallisce. */}
          <source type="image/avif" srcSet={HERO_POSTER_DESKTOP_AVIF} />
          <source type="image/webp" srcSet={HERO_POSTER_DESKTOP_WEBP} />
          <img
            src={HERO_POSTER_DESKTOP_WEBP}
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
      {/* WHY: canvas ribbon a z-index:-1, DOPO il poster nel DOM così, a parità
          di z, si dipinge sopra di esso (crossfade poster→canvas). Wrapper
          inset:0 = box della section; il mount del canvas applica da sé il
          bleed -nav-h, e si estende all'altezza reale della section (cresce col
          contenuto). */}
      <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
        {webglSupported === true ? (
          <HeroCanvas onCanvasReady={onCanvasReady} />
        ) : null}
      </div>

      {/* WHY: UNICO overlay di wash. Sfuma il ribbon verso --color-bg in alto a
          sinistra, staccando badge, H1 e bottoni. z-index:-1 e DOPO il canvas nel
          DOM → lo tinge; stesso bleed -nav-h di poster e canvas, così sfuma anche
          dietro l'header (header trasparente a riposo → gradient continuo). */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 'calc(-1 * var(--hero-nav-h)) 0 0 0',
          zIndex: -1,
          // WHY: gradiente da --hero-wash (globals.css) — default angolo alto-sx,
          // più esteso in mobile landscape per la leggibilità del copy.
          background: 'var(--hero-wash)',
          pointerEvents: 'none',
        }}
      />

      {/* WHY: contenuto IN-FLOW (z-auto) — dà l'altezza alla section (min-height
          come floor) e si dipinge SOPRA gli strati a z-index:-1 (nell'ordine di
          pittura: bg della section → layer z<0 → contenuto in-flow). Niente
          position/z-index qui: darglielo creerebbe uno stacking context che
          escluderebbe il ribbon dal backdrop, e il multiply del paragrafo non
          fonderebbe più. Resta nel contesto isolato della section → fonde. */}
      <HeroContent />
    </section>
  )
}
