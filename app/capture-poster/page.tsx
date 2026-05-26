'use client'

/**
 * /capture-poster — Tool page dev-only.
 * Renderizza il ribbon WebGL su background trasparente, cattura il frame
 * con alpha intatto dal render loop e scarica PNG + WebP.
 *
 * WHY: questa pagina NON è nel routing principale né nell'Header.
 * È accessibile solo digitando l'URL a mano su localhost:3000/capture-poster.
 */

import { useCallback, useEffect, useState } from 'react'
import HeroCanvasProd from '@/components/hero/HeroCanvas.prod'
import { C } from '@/lib/constants'

// ─── Guard produzione ────────────────────────────────────────────────────────
// WHY: process.env.NODE_ENV è sostituito a compile time da Next.js/webpack,
// quindi in produzione questa funzione ritorna prima di qualunque hook
// e il bundle non include niente di ciò che segue.

if (process.env.NODE_ENV !== 'development') {
  // Usata come export default qui sotto — vedi la funzione wrapper in fondo.
}

// ─── Helper download ─────────────────────────────────────────────────────────

/** Scarica il data URL PNG direttamente — alpha channel intatto. */
function downloadPng(dataUrl: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'herocanvasposter-raw.png'
  a.click()
}

// WHY: non tutti i browser supportano toDataURL('image/webp')
// direttamente sul canvas WebGL. Passare per canvas 2D
// garantisce la conversione in tutti i casi.
function downloadWebp(dataUrl: string) {
  const img = new Image()
  img.onload = () => {
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const webpUrl = c.toDataURL('image/webp', 0.92)
    const a = document.createElement('a')
    a.href = webpUrl
    a.download = 'herocanvasposter-raw.webp'
    a.click()
  }
  img.src = dataUrl
}

// ─── Tipi UI ─────────────────────────────────────────────────────────────────

type CaptureStatus = 'waiting' | 'stabilizing' | 'capturing' | 'done'

const STATUS_LABELS: Record<CaptureStatus, string> = {
  waiting: 'In attesa del canvas...',
  stabilizing: 'Canvas pronto, attendo stabilizzazione...',
  capturing: 'Cattura in corso...',
  done: 'Download avviato!',
}

// ─── Componente ──────────────────────────────────────────────────────────────

function CapturePosterDev() {
  const [status, setStatus] = useState<CaptureStatus>('waiting')
  // WHY: captureKey funziona da "trigger" per re-eseguire l'effect senza
  // rimontare HeroCanvasProd — il ribbon rimane in vita e l'utente
  // può scegliere il frame che preferisce prima di ri-catturare.
  const [captureKey, setCaptureKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    let readyInterval: ReturnType<typeof setInterval> | null = null
    let stabilizeTimeout: ReturnType<typeof setTimeout> | null = null
    let captureInterval: ReturnType<typeof setInterval> | null = null

    // WHY: polling a 50ms per catturare __heroCaptureData entro 3 secondi.
    // Il dato arriva nel frame successivo a quello in cui __heroCaptureRequested
    // è true, quindi serve almeno 1 tick (~16ms) — 50ms è un margine sicuro.
    function startCapturePolling() {
      if (cancelled) return
      setStatus('capturing')
      if (typeof window !== 'undefined') {
        window.__heroCaptureRequested = true
      }

      let elapsed = 0
      captureInterval = setInterval(() => {
        elapsed += 50
        if (cancelled) {
          clearInterval(captureInterval!)
          return
        }
        if (typeof window !== 'undefined' && window.__heroCaptureData) {
          clearInterval(captureInterval!)
          const dataUrl = window.__heroCaptureData
          // Pulisce subito la sentinella per non ritirare lo stesso frame
          window.__heroCaptureData = undefined
          setStatus('done')
          downloadPng(dataUrl)
          downloadWebp(dataUrl)
        } else if (elapsed >= 3000) {
          clearInterval(captureInterval!)
          console.error(
            'HeroCapture: timeout — nessun dato ricevuto entro 3 secondi.'
          )
        }
      }, 50)
    }

    function onCanvasReady() {
      if (cancelled) return
      setStatus('stabilizing')
      // WHY: 800ms di attesa per far completare l'animazione di fade-in
      // del canvas (opacity 0→1) e stabilizzare almeno ~48 frame.
      stabilizeTimeout = setTimeout(() => {
        if (!cancelled) startCapturePolling()
      }, 800)
    }

    // Controlla subito se il canvas è già pronto (caso "Cattura di nuovo")
    if (typeof window !== 'undefined' && window.__heroCanvasReady) {
      onCanvasReady()
    } else {
      // Primo caricamento: polling ogni 100ms finché la texture non è caricata
      readyInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.__heroCanvasReady) {
          clearInterval(readyInterval!)
          onCanvasReady()
        }
      }, 100)
    }

    return () => {
      cancelled = true
      if (readyInterval) clearInterval(readyInterval)
      if (stabilizeTimeout) clearTimeout(stabilizeTimeout)
      if (captureInterval) clearInterval(captureInterval)
    }
  }, [captureKey])

  const handleRetry = useCallback(() => {
    // Resetta le sentinelle globali senza rimontare il canvas
    if (typeof window !== 'undefined') {
      window.__heroCaptureRequested = false
      window.__heroCaptureData = undefined
    }
    setStatus('waiting')
    setCaptureKey((k) => k + 1)
  }, [])

  return (
    <>
      {/* ── Canvas WebGL ── ──────────────────────────────────────────────── */}
      {/* WHY: zIndex negativo + pointerEvents none → il canvas sta "sotto"
          la UI senza intercettare click, ma rimane visibile per il debug
          visivo e ovviamente per la cattura. */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <HeroCanvasProd />
      </div>

      {/* ── UI overlay ── ────────────────────────────────────────────────── */}
      <div
        style={{
          minHeight: '100vh',
          background: C.bgDark,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '32px',
        }}
      >
        <p
          style={{
            color: C.accent,
            fontSize: '1.25rem',
            fontWeight: 500,
            textAlign: 'center',
            margin: 0,
          }}
        >
          {STATUS_LABELS[status]}
        </p>

        <button
          onClick={handleRetry}
          style={{
            background: 'transparent',
            border: `1px solid ${C.accent}`,
            color: C.accent,
            padding: '10px 24px',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = '0.7')
          }
          onMouseOut={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = '1')
          }
        >
          Cattura di nuovo
        </button>

        <p
          style={{
            color: C.accent,
            opacity: 0.55,
            fontSize: '0.875rem',
            textAlign: 'center',
            maxWidth: '480px',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          PNG e WebP salvati con alpha trasparente.
          <br />
          Sposta i file in <code>public/textures/</code> e rinominali come
          necessario.
        </p>
      </div>
    </>
  )
}

// ─── Export con guard produzione ─────────────────────────────────────────────

export default function CapturePosterPage() {
  if (process.env.NODE_ENV !== 'development') {
    return <p>Not available in production.</p>
  }
  return <CapturePosterDev />
}
