'use client'

/**
 * TechMarquee — carosello infinito dello stack tecnologico, sotto la hero.
 *
 * Loghi SVG INLINE (componenti via SVGR): niente richieste/preload, vettoriale.
 * Scorrimento guidato da JS (requestAnimationFrame) per il DRAG-AND-PULL.
 *
 * Interazione (un solo path Pointer Events per mouse + touch + pen):
 *  • focus (mouse sopra un logo / dito che tocca un logo) → PAUSA + spotlight +
 *    tooltip del logo a fuoco. Spotlight e tooltip sono guidati da JS (classi
 *    is-focusing/is-active + stato React), NON da CSS :hover → funzionano anche
 *    su touch.
 *  • drag (premuto e mosso oltre una soglia) → afferra e trascina; spotlight e
 *    tooltip sospesi (cursor: grabbing). `pos` è avvolto modulo larghezza-gruppo
 *    → loop infinito senza giunture.
 *  • rilascio → mouse: torna a fuoco sul logo sotto il cursore (spotlight/tooltip);
 *    touch: fine interazione → riprende lo scorrimento autonomo.
 *  • il puntatore esce dalla fascia → riprende lo scorrimento.
 *
 * Reduced-motion: niente scorrimento automatico, ma resta trascinabile.
 * A11y/SEO: `role="img"` + `aria-label` per ogni logo; la region è etichettata
 * dall'aria-label del <section> (niente heading sr-only: sarebbe un doppione).
 * Il clone è aria-hidden.
 */

import { useEffect, useRef, useState } from 'react'
import type { ComponentType, SVGProps } from 'react'

import Html5 from '@/assets/logos/html5.svg'
import Css3 from '@/assets/logos/css3.svg'
import Javascript from '@/assets/logos/javascript.svg'
import Typescript from '@/assets/logos/typescript.svg'
import Php from '@/assets/logos/php.svg'
import ReactLogo from '@/assets/logos/react.svg'
import NextjsLight from '@/assets/logos/nextjs-light.svg'
import NextjsDark from '@/assets/logos/nextjs-dark.svg'
import Tailwind from '@/assets/logos/tailwind.svg'
import Bootstrap from '@/assets/logos/bootstrap.svg'
import Wordpress from '@/assets/logos/wordpress.svg'
import Woocommerce from '@/assets/logos/woocommerce.svg'
import Flutter from '@/assets/logos/flutter.svg'
import Vscode from '@/assets/logos/vscode.svg'
import CursorLight from '@/assets/logos/cursor-light.svg'
import CursorDark from '@/assets/logos/cursor-dark.svg'
import Figma from '@/assets/logos/figma.svg'
import IllustratorLight from '@/assets/logos/illustrator.svg'
import IllustratorDark from '@/assets/logos/illustrator-dark.svg'
import Photoshop from '@/assets/logos/photoshop.svg'
import Premierepro from '@/assets/logos/premierepro.svg'
import Aftereffects from '@/assets/logos/aftereffects.svg'
import Blender from '@/assets/logos/blender.svg'

type SvgComp = ComponentType<SVGProps<SVGSVGElement>>

// WHY: marchi che spariscono su uno dei due fondi → due varianti SVG e show/hide
// via .dark (stesso pattern Sole/Luna dell'header, zero hydration mismatch):
//  • Next.js: cerchio nero invisibile sul navy → variante a disco bianco.
//  • Cursor: due varianti ufficiali chiare/scure.
//  • Illustrator: tile #330000 cupo sul navy → variante invertita (tile arancione).
// `label` è single source: alimenta aria-label, data-label (delegation) e tooltip.
type Logo =
  | { readonly label: string; readonly Comp: SvgComp }
  | { readonly label: string; readonly Light: SvgComp; readonly Dark: SvgComp }

// Ordine: linguaggi → librerie/framework → strumenti dev → design/motion.
// Versioni (giugno 2026) solo per linguaggi/tech; IDE e programmi di editing
// portano il solo nome. Le label vivono qui → banali da aggiornare.
const LOGOS: readonly Logo[] = [
  { label: 'HTML5', Comp: Html5 },
  { label: 'CSS3', Comp: Css3 },
  { label: 'JavaScript ES2025', Comp: Javascript },
  { label: 'TypeScript 6.0', Comp: Typescript },
  { label: 'PHP 8.5', Comp: Php },
  { label: 'React 19', Comp: ReactLogo },
  { label: 'Next.js 16', Light: NextjsLight, Dark: NextjsDark },
  { label: 'Tailwind CSS 4', Comp: Tailwind },
  { label: 'Bootstrap 5.3', Comp: Bootstrap },
  { label: 'WordPress 6.8', Comp: Wordpress },
  { label: 'WooCommerce 10', Comp: Woocommerce },
  { label: 'Flutter 3.44', Comp: Flutter },
  { label: 'Visual Studio Code', Comp: Vscode },
  { label: 'Cursor', Light: CursorLight, Dark: CursorDark },
  { label: 'Figma', Comp: Figma },
  { label: 'Adobe Illustrator', Light: IllustratorLight, Dark: IllustratorDark },
  { label: 'Adobe Photoshop', Comp: Photoshop },
  { label: 'Adobe Premiere Pro', Comp: Premierepro },
  { label: 'Adobe After Effects', Comp: Aftereffects },
  { label: 'Blender', Comp: Blender },
]

function LogoGfx({ logo }: { logo: Logo }) {
  if ('Comp' in logo) {
    const Comp = logo.Comp
    return <Comp role="img" aria-label={logo.label} focusable={false} />
  }

  const { Light, Dark } = logo
  return (
    <>
      {/* light: visibile di default, nascosta in dark */}
      <Light
        role="img"
        aria-label={logo.label}
        focusable={false}
        className="block dark:hidden"
      />
      {/* dark: nascosta di default, visibile in dark. aria-hidden → l'aria-label
          della variante light basta, niente doppio annuncio. */}
      <Dark aria-hidden focusable={false} className="hidden dark:block" />
    </>
  )
}

function LogoGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul className="marquee__group" aria-hidden={ariaHidden || undefined}>
      {LOGOS.map((logo) => (
        // data-label → letto in delegation per il tooltip (vedi useEffect)
        <li key={logo.label} className="marquee__item" data-label={logo.label}>
          <LogoGfx logo={logo} />
        </li>
      ))}
    </ul>
  )
}

type Tip = { readonly label: string; readonly x: number; readonly y: number }

export default function TechMarquee() {
  const [tip, setTip] = useState<Tip | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const clip = clipRef.current
    const section = sectionRef.current
    if (!track || !clip || !section) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')

    // larghezza di UN gruppo = periodo del loop (i due gruppi sono identici)
    const firstGroup = track.querySelector<HTMLElement>('.marquee__group')
    let groupWidth = 0
    const measure = () => {
      groupWidth = firstGroup ? firstGroup.getBoundingClientRect().width : 0
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (firstGroup) ro.observe(firstGroup)

    // velocità: un giro (groupWidth) in --marquee-duration secondi (single source CSS)
    const durSec =
      parseFloat(
        getComputedStyle(track).getPropertyValue('--marquee-duration')
      ) || 72

    let pos = 0
    let raf = 0
    let last = 0
    let pressing = false
    let dragging = false
    let startX = 0
    let startPos = 0
    let capturedId = -1
    let activeEl: HTMLElement | null = null // logo a fuoco (spotlight)
    const THRESHOLD = 8 // px: oltre questo, un press diventa drag (sotto = tap/click)

    const apply = () => {
      track.style.transform = `translate3d(${-pos}px, 0, 0)`
    }
    const wrapPos = () => {
      if (groupWidth > 0) pos = ((pos % groupWidth) + groupWidth) % groupWidth
    }
    const frame = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05) // clamp → niente scatto da tab background
      last = t
      if (groupWidth > 0) {
        pos += (groupWidth / durSec) * dt
        wrapPos()
        apply()
      }
      raf = requestAnimationFrame(frame)
    }
    // l'auto-scroll gira solo se NON c'è un logo a fuoco, non si trascina, no reduced-motion
    const canAuto = () => !activeEl && !dragging && !reduce.matches
    const startAuto = () => {
      if (raf || !canAuto()) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stopAuto = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    const refreshAuto = () => {
      if (canAuto()) startAuto()
      else stopAuto()
    }

    // SPOTLIGHT — classi is-active/is-focusing (no :hover → ok su touch). Attivo
    // sia in hover sia DURANTE il drag (segue il logo sotto il cursore). Chiama
    // SEMPRE refreshAuto (anche a parità di logo) → niente loop bloccato dopo il
    // drag su touch (il bug: focusEl già null → clearFocus usciva prima di riavviare).
    const setActive = (el: HTMLElement | null) => {
      if (el !== activeEl) {
        if (activeEl) activeEl.classList.remove('is-active')
        activeEl = el
        if (el) {
          el.classList.add('is-active')
          section.classList.add('is-focusing')
        } else {
          section.classList.remove('is-focusing')
        }
      }
      refreshAuto()
    }
    // TOOLTIP — solo in hover (mai durante il drag). null = nascondi.
    const showTipFor = (el: HTMLElement | null) => {
      if (!el) {
        setTip(null)
        return
      }
      const r = el.getBoundingClientRect()
      setTip({ label: el.dataset.label ?? '', x: r.left + r.width / 2, y: r.top })
    }
    const logoFromEvent = (e: PointerEvent) =>
      (e.target as HTMLElement | null)?.closest<HTMLElement>('.marquee__item') ??
      null
    const logoAtPoint = (x: number, y: number) =>
      (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>(
        '.marquee__item'
      ) ?? null

    // ── pointer ──
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      pressing = true
      startX = e.clientX
      startPos = pos
      // touch: mostra subito spotlight + tooltip del logo premuto (non c'è hover)
      const el = logoFromEvent(e)
      setActive(el)
      showTipFor(el)
    }
    const onMove = (e: PointerEvent) => {
      if (dragging) {
        // trascina a destra → contenuto a destra (pull naturale)
        pos = startPos - (e.clientX - startX)
        wrapPos()
        apply()
        // SPOTLIGHT anche durante il drag: segue il logo sotto il cursore. Con la
        // capture e.target è il clip → uso elementFromPoint. Niente tooltip in drag.
        setActive(logoAtPoint(e.clientX, e.clientY))
        return
      }
      if (pressing && Math.abs(e.clientX - startX) > THRESHOLD) {
        // press → drag: nascondi il tooltip ma MANTIENI lo spotlight (segue il drag)
        dragging = true
        section.classList.add('is-dragging')
        setTip(null)
        startX = e.clientX
        startPos = pos // re-anchor → nessun salto al superamento soglia
        try {
          clip.setPointerCapture(e.pointerId)
          capturedId = e.pointerId
        } catch {
          // capture non disponibile: si procede senza
        }
        return
      }
      if (!pressing) {
        // hover desktop → aggiorna spotlight + tooltip del logo sotto il cursore
        const el = logoFromEvent(e)
        if (el !== activeEl) {
          setActive(el)
          showTipFor(el)
        }
      }
    }
    const releaseCapture = () => {
      if (capturedId >= 0) {
        try {
          clip.releasePointerCapture(capturedId)
        } catch {
          // già rilasciata
        }
        capturedId = -1
      }
    }
    // reset: niente spotlight, niente tooltip, e RIPRENDE lo scorrimento
    // (setActive(null) chiama sempre refreshAuto → startAuto).
    const reset = () => {
      setActive(null)
      setTip(null)
    }
    const onUp = (e: PointerEvent) => {
      if (dragging) {
        dragging = false
        section.classList.remove('is-dragging')
        releaseCapture()
        pressing = false
        if (e.pointerType === 'mouse') {
          // mouse: torna a fuoco sul logo sotto il cursore (spotlight + tooltip)
          const el = logoAtPoint(e.clientX, e.clientY)
          setActive(el)
          showTipFor(el)
        } else {
          // touch/pen: rilascio = fine interazione → riprende lo scorrimento
          reset()
        }
        return
      }
      // tap/click senza drag
      pressing = false
      if (e.pointerType !== 'mouse') reset() // touch tap → libera e riprende
      // mouse click senza drag → resta a fuoco (è ancora in hover)
    }
    const onCancel = () => {
      if (dragging) {
        dragging = false
        section.classList.remove('is-dragging')
        releaseCapture()
      }
      pressing = false
      reset()
    }
    const onLeave = () => {
      if (dragging) return // durante il drag (capture) il leave non conclude
      reset()
    }
    const onReduceChange = () => refreshAuto()

    clip.addEventListener('pointerdown', onDown)
    clip.addEventListener('pointermove', onMove)
    clip.addEventListener('pointerup', onUp)
    clip.addEventListener('pointercancel', onCancel)
    clip.addEventListener('pointerleave', onLeave)
    reduce.addEventListener('change', onReduceChange)

    apply()
    startAuto()

    return () => {
      stopAuto()
      ro.disconnect()
      reduce.removeEventListener('change', onReduceChange)
      clip.removeEventListener('pointerdown', onDown)
      clip.removeEventListener('pointermove', onMove)
      clip.removeEventListener('pointerup', onUp)
      clip.removeEventListener('pointercancel', onCancel)
      clip.removeEventListener('pointerleave', onLeave)
      section.classList.remove('is-focusing', 'is-dragging')
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="stack"
      className="marquee"
      aria-label="Tecnologie e strumenti che uso"
    >
      <div className="marquee__viewport">
        {/* clip = solo content-box (i loghi spariscono sulla linea del padding) +
            AREA di drag (cursor: grab). */}
        <div className="marquee__clip" ref={clipRef}>
          <div className="marquee__track" ref={trackRef}>
            <LogoGroup />
            <LogoGroup ariaHidden />
          </div>
        </div>
      </div>

      {/* WHY: filtro per il mute "slate" dei loghi non a fuoco. Desatura
          (feColorMatrix saturate 0 → luminanza) poi mappa la luminanza in toni di
          #5c7ca6 (white→#5c7ca6, dark→slate scuro): MANTIENE i dettagli interni
          (lettere dei tile) invece di appiattirli. Referenziato da CSS via
          filter:url(#marquee-mute-slate). color-interpolation-filters:sRGB così la
          matrice corrisponde all'hex. Hidden, zero impatto sul layout. */}
      <svg
        aria-hidden
        focusable={false}
        width={0}
        height={0}
        style={{ position: 'absolute', width: 0, height: 0 }}
      >
        <defs>
          <filter id="marquee-mute-slate" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feColorMatrix
              type="matrix"
              values="0.1804 0 0 0 0.1804 0.2431 0 0 0 0.2431 0.3255 0 0 0 0.3255 0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>

      {tip ? (
        <div
          key={tip.label}
          role="tooltip"
          className="marquee__tip"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.label}
          <span className="marquee__tip-arrow" aria-hidden />
        </div>
      ) : null}
    </section>
  )
}
