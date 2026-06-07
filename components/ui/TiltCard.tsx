'use client'

/**
 * TiltCard — primitivo card del sistema: superficie a vetro con tilt 3D
 * leggerissimo e bordo illuminato, entrambi che seguono il cursore.
 *
 * WHY primitivo: l'effetto (vetro + tilt + glow) deve essere identico su ogni
 * card del sito — qui la "progetto in evidenza", domani le card della sezione
 * portfolio. Incapsulandolo qui la coerenza visiva è garantita e il chiamante
 * passa solo il contenuto. Vetro e colori del glow vivono in globals.css
 * (.tilt-card / .dark .tilt-card): cambiano tema prima dell'hydration, niente
 * flash e niente isDark in JS.
 *
 * Tecnica:
 * - tilt = transform: perspective() rotateX/rotateY pilotato da --rx/--ry, con
 *   una transizione breve ease-out che fa "inseguire" il cursore senza scatti.
 * - bordo illuminato = pseudo-elemento ::before mascherato (mask-composite) che
 *   mostra solo l'anello di 1px; un radial-gradient ancorato a --mx/--my accende
 *   il segmento vicino al puntatore.
 *
 * Accessibilità/robustezza:
 * - solo mouse (pointerType === 'mouse'): su touch/pen niente tilt.
 * - prefers-reduced-motion: transform azzerato in CSS (luce statica, niente moto).
 */

import {
  useCallback,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** rotazione massima in gradi sui due assi */
  maxTilt?: number
}

export default function TiltCard({
  children,
  className = '',
  style,
  maxTilt = 2,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  // rAF pendente + ultima posizione del puntatore: il lavoro avviene una volta
  // per frame, non a ogni evento pointermove (che può arrivare a centinaia/s).
  const frame = useRef<number | null>(null)
  const point = useRef<{ x: number; y: number } | null>(null)

  const apply = useCallback(() => {
    frame.current = null
    const el = ref.current
    const p = point.current
    if (!el || !p) return
    const rect = el.getBoundingClientRect()
    const px = (p.x - rect.left) / rect.width // 0..1 orizzontale
    const py = (p.y - rect.top) / rect.height // 0..1 verticale
    // alto-sx → rotazione verso l'osservatore; mappato in [-maxTilt, +maxTilt]
    const rx = (0.5 - py) * 2 * maxTilt
    const ry = (px - 0.5) * 2 * maxTilt
    el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`)
    el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`)
    el.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
    el.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
  }, [maxTilt])

  const handleMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse') return
      point.current = { x: e.clientX, y: e.clientY }
      if (frame.current === null) frame.current = requestAnimationFrame(apply)
    },
    [apply]
  )

  const handleEnter = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    ref.current?.setAttribute('data-active', '')
  }, [])

  const handleLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
    el.removeAttribute('data-active')
    // ritorno a riposo: la transizione CSS riporta la card in piano
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`.trim()}
      style={style}
      onPointerMove={handleMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      {children}
    </div>
  )
}
