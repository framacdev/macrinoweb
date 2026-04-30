'use client'

/**
 * Hero — la sezione principale della homepage.
 *
 * Architettura a strati (z-index):
 * - z=0: RibbonHero (background WebGL trasparente con il nastro animato)
 * - z=1: contenuto testuale (titolo, sottotitolo, CTA) sulla sinistra
 *
 * RibbonHero è caricato in dynamic import con ssr:false per due motivi:
 * 1. Three.js richiede window/document → fallirebbe in SSR
 * 2. Riduce significativamente il TTFB: il bundle 3D viene caricato solo
 *    client-side, dopo l'HTML iniziale.
 *
 * Il pointer-events:none è applicato direttamente al <canvas> dentro il
 * componente RibbonHero, NON sul wrapper. Questo evita che la regola si
 * propaghi in cascade ad altri elementi (Leva in particolare).
 */

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { C } from '@/lib/constants'

// Dynamic import del componente Three.js. ssr:false è critico — senza,
// Next prova a renderizzare server-side e crasha su `window is undefined`.
const RibbonHero = dynamic(
  () => import('@/components/three/RibbonHero'),
  {
    ssr: false,
    loading: () => null, // niente placeholder visivo durante il fetch
  },
)

export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        // dvh = dynamic viewport height: gestisce correttamente la barra
        // mobile di Safari/Chrome che si nasconde durante lo scroll.
        // La doppia dichiarazione è un fallback per browser vecchi.
        minHeight: '100vh',
        // @ts-expect-error - dvh non è ancora in tutti i type CSSProperties
        minHeight: 'calc(100dvh - 60px)',
        display: 'flex',
        alignItems: 'center',
        // overflow:hidden previene scrollbar orizzontali se il nastro
        // sfora i bordi del viewport durante il tuning Leva.
        overflow: 'hidden',
      }}
    >
      {/* ── Background WebGL (z=0, sotto al testo) ──────────────────────── */}
      {/*
       * Wrapper del canvas: NIENTE pointer-events:none qui.
       * Il pointer-events:none è applicato direttamente sull'elemento
       * <canvas> all'interno di RibbonHero. Questo evita che la regola si
       * propaghi e blocchi altri elementi posizionati nella stessa zona
       * (tipo il pannello Leva durante il tuning).
       */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
        }}
      >
        <RibbonHero />
      </div>

      {/* ── Contenuto hero (z=1, sopra al nastro) ───────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1300px',
          margin: '0 auto',
          width: '100%',
          padding: '0 24px',
        }}
      >
        <div style={{ maxWidth: '720px' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: C.primary,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            Web Developer · Roma
          </span>

          <h1 style={{ marginBottom: '24px', maxWidth: '14ch' }}>
            Trasformo idee complesse in soluzioni digitali.
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: 'var(--color-body)',
              marginBottom: '32px',
              maxWidth: '52ch',
            }}
          >
            Sviluppo siti e applicazioni web con focus su qualità,
            performance e risultati concreti. Costruisco prodotti rapidi,
            accessibili e fatti per durare.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <Link
              href="/contatti"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 32px',
                backgroundColor: C.primary,
                color: C.bg,
                borderRadius: '4px',
                border: `1px solid ${C.primary}`,
                fontFamily: 'var(--font-inter)',
                fontWeight: 600,
                fontSize: '16px',
                letterSpacing: '0.02em',
                textDecoration: 'none',
                transition:
                  'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              }}
            >
              Contattami
            </Link>

            <Link
              href="/portfolio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 32px',
                backgroundColor: 'transparent',
                color: 'var(--color-text)',
                borderRadius: '4px',
                border: `1px solid ${C.headerBorder}`,
                fontFamily: 'var(--font-inter)',
                fontWeight: 600,
                fontSize: '16px',
                letterSpacing: '0.02em',
                textDecoration: 'none',
                transition: 'border-color 0.3s ease-in-out',
              }}
            >
              Vedi il portfolio
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}