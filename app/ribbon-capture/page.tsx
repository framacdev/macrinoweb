'use client'

/**
 * /ribbon-capture — strumento di sviluppo per catturare i poster del ribbon.
 *
 * Renderizza il ribbon reale (HeroCanvasCore in captureMode: frame congelato a
 * t=0, sfondo trasparente, preserveDrawingBuffer) alle dimensioni esatte di
 * ciascun breakpoint, e scarica PNG + WebP via canvas.toBlob().
 *
 * Perché qui e non headless: la cattura avviene dalla TUA GPU reale, identica
 * alla produzione — un headless (ANGLE/SwiftShader) renderizzerebbe AA e
 * precisione float diversi, e il poster non combacerebbe col canvas live al
 * crossfade. toBlob esporta nativamente sia PNG che WebP, senza dipendenze.
 *
 * Uso: apri /ribbon-capture, seleziona un preset, attendi il render, scarica il
 * PNG (è il master). Mettilo in assets/hero-posters/ e lancia `npm run posters`
 * per rigenerare i poster serviti (AVIF + WebP) in public/ribbon-fallback/.
 * Dev-only: in produzione la pagina non mostra lo strumento.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { HeroCanvasCore } from '@/components/hero/HeroCanvasCore'
import { cloneHeroRibbonDefaults } from '@/lib/hero/heroControlDefaults'

// Dimensioni allineate ai poster esistenti in public/ribbon-fallback/.
const PRESETS = [
  { key: 'landscape', label: 'Mobile landscape (≤ 1024px)', w: 2048, h: 1366 },
  {
    key: 'sportrait',
    label: 'Small phone portrait (< 576px)',
    w: 1150,
    h: 1536,
  },
  { key: 'tablet', label: 'Large phone portrait (< 768px)', w: 1536, h: 1536 },
  { key: 'lgtablet', label: 'Tablet / laptop (768–1024px)', w: 2048, h: 1536 },
  { key: 'desktop', label: 'Desktop (> 1024px)', w: 2538, h: 1398 },
] as const

type Preset = (typeof PRESETS)[number]

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function RibbonCapturePage() {
  const [preset, setPreset] = useState<Preset>(PRESETS[0])
  // readyKey = preset il cui canvas ha finito di renderizzare. `ready` è derivato:
  // al cambio preset (rimonta HeroCanvasCore) torna automaticamente false senza
  // bisogno di un effetto che resetti lo stato.
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const ready = readyKey === preset.key
  const [scale, setScale] = useState(1)
  const boxRef = useRef<HTMLDivElement>(null)
  const ctrlRef = useRef(cloneHeroRibbonDefaults())

  // Scala anteprima per far stare il box (a risoluzione piena) nell'area visibile.
  useEffect(() => {
    const fit = () => {
      const availW = window.innerWidth * 0.62
      const availH = window.innerHeight * 0.66
      setScale(Math.min(1, availW / preset.w, availH / preset.h))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [preset])

  const onCanvasReady = useCallback(() => setReadyKey(preset.key), [preset])

  const grab = useCallback(
    (type: 'image/png' | 'image/webp', ext: 'png' | 'webp') => {
      const canvas = boxRef.current?.querySelector('canvas')
      if (!canvas) return
      canvas.toBlob(
        (blob) => {
          if (blob) download(blob, `herocanvasposter-${preset.key}.${ext}`)
        },
        type,
        type === 'image/webp' ? 0.92 : undefined
      )
    },
    [preset]
  )

  const grabBoth = useCallback(() => {
    grab('image/png', 'png')
    grab('image/webp', 'webp')
  }, [grab])

  if (process.env.NODE_ENV === 'production') {
    return (
      <main style={{ padding: 48, fontFamily: 'var(--font-body)' }}>
        <h1>/ribbon-capture</h1>
        <p>Strumento disponibile solo in sviluppo.</p>
      </main>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#11151c',
        color: '#e9eef4',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          ribbon-capture
        </strong>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p)}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.18)',
                background: p.key === preset.key ? '#2273d4' : 'transparent',
                color: '#e9eef4',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {p.label} · {p.w}×{p.h}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={grabBoth}
            disabled={!ready}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              background: ready ? '#3da9fc' : 'rgba(255,255,255,0.12)',
              color: ready ? '#0f1e2d' : 'rgba(255,255,255,0.4)',
              fontWeight: 600,
              cursor: ready ? 'pointer' : 'not-allowed',
            }}
          >
            {ready ? 'Scarica PNG + WebP' : 'Rendering…'}
          </button>
        </div>
      </div>

      {/* Area anteprima — sfondo a scacchiera per mostrare la trasparenza */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          backgroundColor: '#1b2129',
          backgroundImage:
            'linear-gradient(45deg, #232b35 25%, transparent 25%), linear-gradient(-45deg, #232b35 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #232b35 75%), linear-gradient(-45deg, transparent 75%, #232b35 75%)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
        }}
      >
        {/* Wrapper scalato per l'anteprima; il box interno resta a risoluzione piena */}
        <div
          style={{
            width: preset.w * scale,
            height: preset.h * scale,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: preset.w,
              height: preset.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {/* position:relative + dimensioni esatte → HeroCanvasCore (inset:0 in
                captureMode) riempie il box; canvas.toBlob esporta preset.w×preset.h */}
            <div
              ref={boxRef}
              style={{
                position: 'relative',
                width: preset.w,
                height: preset.h,
              }}
            >
              <HeroCanvasCore
                key={preset.key}
                ctrlRef={ctrlRef}
                captureMode
                onCanvasReady={onCanvasReady}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '10px 20px',
          fontSize: 12,
          color: 'rgba(255,255,255,0.55)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        Sostituisci i file scaricati in{' '}
        <code style={{ fontFamily: 'var(--font-mono)' }}>
          public/ribbon-fallback/
        </code>
        . Frame congelato a t=0 (coincide col primo frame del canvas live →
        crossfade senza salti).
      </div>
    </div>
  )
}
