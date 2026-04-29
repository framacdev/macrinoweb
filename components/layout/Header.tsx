'use client'

/**
 * Header — componente di navigazione globale
 *
 * 'use client' è necessario perché usa:
 * - useState (stato locale: scroll, menu aperto, hover)
 * - useEffect (listener scroll e resize)
 * - useTheme (context di next-themes)
 * - Framer Motion (animazioni interattive)
 *
 * Struttura:
 * <header> (sticky, full-width, bg e border-bottom)
 *   └─ <div> (max-width 1300px, centrato, padding outer)
 *        └─ <motion.nav> (la card floating, padding inner)
 *             ├─ LEFT: Logo + Desktop Nav
 *             └─ RIGHT: Theme Toggle + CTA + Hamburger
 *
 * <AnimatePresence> (fuori dall'header, fixed overlay)
 *   └─ MobileMenu (se isMenuOpen === true)
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import MacrinoLogo from '@/components/ui/MacrinoLogo'
import { C } from '@/lib/constants'

// ─────────────────────────────────────────────────────────────────────────────
// COSTANTI — centralizzate qui per non ripetere stringhe e valori nei JSX
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Chi sono', href: '/chi-sono' },
  { label: 'Portfolio', href: '/portfolio' },
]

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedArrowIcon — ChevronRight che diventa ArrowRight sull'hover della CTA
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedArrowIcon({ isHovered }: { isHovered: boolean }) {
  /*
   * Due path separati con coordinate calibrate per connessione perfetta:
   *
   * ASTA: M0 8 L7 8
   *   strokeLinecap="round" → si estende visivamente fino a x=7.875
   *   pathLength da 0 a 1 → l'asta si rivela da sinistra
   *   opacity 0→1 per evitare artefatti sul cap sinistro
   *
   * PUNTA: M6 3.5 L12 8 L6 12.5
   *   leftmost a x=6, con round cap estesa visivamente fino a x=5.125
   *   translateX 0→2 su hover → leftmost visivo si sposta a x=7.125
   *   Overlap con asta (7.125 < 7.875): connessione garantita ad ogni frame
   *
   * CONTAINER: 20px fissi, overflow hidden
   *   La punta hovered raggiunge x=14, mai oltre 20px → nessun clipping
   *   Il button non cambia mai larghezza
   */
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: '20px',
        height: '16px',
        marginRight: '-8px',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
        {/* Asta */}
        <motion.path
          d="M 4 8 L 12 8"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          style={{ zIndex: -1 }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        />
        {/* Punta — si sposta leggermente a destra sull'hover */}
        <motion.path
          d="M 7 3.5 L 12 8 L 7 12.5"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ x: isHovered ? 2 : 0 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        />
      </svg>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CTAButton — bottone "Contattami"
//
// È un <Link> Next.js che renderizza un <a> con stili da bottone.
// La sua larghezza è sempre quella naturale data dal contenuto + padding,
// senza mai crescere oltre, anche quando affiancato a uno switch quadrato
// nel mobile menu (gestito tramite justify-content: space-between sul parent).
// ─────────────────────────────────────────────────────────────────────────────

function CTAButton({ onClick }: { onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href="/contatti"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={() => setIsHovered(true)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '10px 28px',
        backgroundColor: isHovered ? C.primaryHover : C.primary,
        color: C.bg,
        borderRadius: '4px',
        border: `1px solid ${isHovered ? C.primaryHover : C.primary}`,
        cursor: 'pointer',
        fontFamily: 'var(--font-inter)',
        fontWeight: '600',
        letterSpacing: '0.02em',
        fontSize: '16px',
        whiteSpace: 'nowrap',
        boxShadow: isHovered ? C.ctaHoverShadow : 'none',
        textDecoration: 'none',
        transition:
          'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
      }}
    >
      Contattami
      <AnimatedArrowIcon isHovered={isHovered} />
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HamburgerIcon
//
// PRINCIPIO CHIAVE: tutto avviene SIMULTANEAMENTE, non sequenzialmente.
// Convergenza (y) e rotazione partono allo stesso istante e finiscono allo
// stesso istante. L'effetto visivo "barra unica → X" è un'illusione generata
// dal movimento parallelo: l'occhio vede le barre che si avvitano fluidamente,
// e in qualche frame intermedio sembrano sovrapporsi creando la barra unica.
//
// Apertura (3 barre → X):
//   - top: y da 0 a +SHIFT_Y, opacity da 1 a 0
//   - middle: rotate da 0° a 225°
//   - bottom: y da 0 a -SHIFT_Y, rotate da 0° a -225°
//   Tutte queste animazioni partono insieme con la stessa cubic-bezier.
//
// Chiusura (X → 3 barre): tutti i valori tornano a 0 simultaneamente,
// con la stessa identica curva di easing. La sensazione è di "svitamento".
//
// PERCHÉ ±225° E NON ±45°:
// Posizioni finali geometricamente identiche (mod 360°), ma il percorso
// animato è 5x più lungo. È mezzo giro completo + 45° finali — quello che
// genera la sensazione di vortice invece di un semplice "splay".
//
// EASING:
// cubic-bezier(0.215, 0.61, 0.355, 1) — ease-out cubico estratto dai CSS
// originali Breakdance. Parte snappy, decelera dolcemente alla fine.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HamburgerIcon — replica esatta del pattern "Spin" di hamburgers.css
// (Jonathan Suh, https://jonsuh.com/hamburgers/)
//
// COMPORTAMENTO ORIGINALE:
// Tre elementi (.hamburger-inner + ::before + ::after) dove ::after è figlio
// di .hamburger-inner e quindi eredita la sua rotazione. Quando la centrale
// ruota di 225° e ::after di -90° (rispetto al parent), la composizione
// finale è 225 - 90 = 135° → la X è formata dalla centrale a 225° e dalla
// bottom a 135°.
//
// REPLICA CON SIBLINGS (NO PSEUDO-ELEMENTI):
// Avendo tre <motion.span> indipendenti devo "linearizzare" la matematica:
// • centrale: rotate 0° → 225° (identico)
// • bottom: rotate 0° → 135° (= 225° + (-90°), già composto)
// Le due rotazioni vanno entrambe in senso orario (positivo): è il pattern
// "Spin", non "Vortex" (vortex userebbe rotazioni opposte).
//
// SEQUENZA APERTURA (hamburger → X):
//   0ms ────────── 100ms ── 120ms ───────────────── 340ms
//   [top scende ][svanisce  ]                        |
//   [bot sale  ][delay      ][rotazione a 135°       ]
//                  [delay   ][rotazione cent. a 225°]
//
// Effetto visivo: prima convergenza (le 3 barre si sovrappongono creando
// l'illusione della "barra unica"), poi rotazione simultanea che apre la X.
//
// SEQUENZA CHIUSURA (X → hamburger):
//   0ms ──────────────── 220ms ── 250ms ──── 350ms
//   [opacity top a 1   ]
//   [rotazione cent. a 0]                    |
//   [rotazione bot a 0  ][delay  ][bot giù  ]
//                        [delay  ][top su   ]
//
// Effetto visivo: prima la X "si svita" tornando barra unica, poi le barre
// si separano tornando alle posizioni originali.
//
// CUBIC-BEZIER:
// • Apertura → cubic-bezier(0.215, 0.61, 0.355, 1) [ease-out cubico]
// • Chiusura → cubic-bezier(0.55, 0.055, 0.675, 0.19) [ease-in cubico]
// L'asimmetria delle curve è ciò che rende la rotazione percettivamente
// "organica" e non meccanica.
// ─────────────────────────────────────────────────────────────────────────────

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  // Distanza centro-centro tra due barre adiacenti.
  // height 1.5px + gap 4px → 1.5/2 + 4 + 1.5/2 = 5.5px
  const SHIFT_Y = 5.5

  // Cubic-bezier estratte dal SCSS originale di hamburgers.css
  const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const // apertura
  const EASE_IN_CUBIC = [0.55, 0.055, 0.675, 0.19] as const // chiusura

  const barBase: React.CSSProperties = {
    display: 'block',
    width: '16px',
    height: '1.5px',
    backgroundColor: C.primary,
    borderRadius: '2px',
    transformOrigin: 'center',
  }

  // ── BARRA SUPERIORE (top) ────────────────────────────────────────────────
  // Apertura: y scende subito (0-100ms), poi opacity svanisce dopo delay 120ms
  // Chiusura: opacity riappare subito (0-100ms), poi y risale dopo delay 250ms
  const topTransitionOpen = {
    y: { duration: 0.1, ease: 'easeOut' as const },
    opacity: { duration: 0.1, delay: 0.12, ease: 'easeOut' as const },
  }
  const topTransitionClose = {
    opacity: { duration: 0.1, ease: 'easeIn' as const },
    y: { duration: 0.1, delay: 0.25, ease: 'easeIn' as const },
  }

  // ── BARRA CENTRALE (middle) ──────────────────────────────────────────────
  // Apertura: ruota a 225° dopo delay di 120ms (aspetta che le altre convergano)
  // Chiusura: ruota a 0° immediatamente (parte subito a "svitarsi")
  const middleTransitionOpen = {
    rotate: { duration: 0.22, delay: 0.12, ease: EASE_OUT_CUBIC },
  }
  const middleTransitionClose = {
    rotate: { duration: 0.22, ease: EASE_IN_CUBIC },
  }

  // ── BARRA INFERIORE (bottom) ─────────────────────────────────────────────
  // Apertura: y sale subito (0-100ms), poi rotazione a 135° dopo delay 120ms
  // Chiusura: rotazione torna a 0 subito, poi y scende dopo delay 250ms
  // Nota: 135° (non -45°) per percorrere il giro lungo che caratterizza lo Spin
  const bottomTransitionOpen = {
    y: { duration: 0.1, ease: 'easeOut' as const },
    rotate: { duration: 0.22, delay: 0.12, ease: EASE_OUT_CUBIC },
  }
  const bottomTransitionClose = {
    rotate: { duration: 0.22, ease: EASE_IN_CUBIC },
    y: { duration: 0.1, delay: 0.25, ease: 'easeIn' as const },
  }

  return (
    <div
      style={{
        width: '16px',
        height: `${SHIFT_Y * 2 + 1.5}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {/* Barra superiore */}
      <motion.span
        style={barBase}
        animate={isOpen ? { y: SHIFT_Y, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={isOpen ? topTransitionOpen : topTransitionClose}
      />

      {/* Barra centrale — guida la rotazione, finisce a 225° */}
      <motion.span
        style={barBase}
        animate={isOpen ? { rotate: 225 } : { rotate: 0 }}
        transition={isOpen ? middleTransitionOpen : middleTransitionClose}
      />

      {/* Barra inferiore — converge al centro, poi ruota a 135° (= 225° - 90°) */}
      <motion.span
        style={barBase}
        animate={isOpen ? { y: -SHIFT_Y, rotate: 135 } : { y: 0, rotate: 0 }}
        transition={isOpen ? bottomTransitionOpen : bottomTransitionClose}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileMenu — overlay full-screen con animazione "saracinesca"
//
// È un elemento separato dalla <header>, posizionato con position: fixed
// che copre l'intero viewport. Poiché la <header> ha z-index 50 e il menu
// z-index 49, la header rimane visibile sopra il menu mentre questo
// scorre verso il basso — creando l'effetto saracinesca che parte
// dall'header stessa.
// ─────────────────────────────────────────────────────────────────────────────

function MobileMenu({
  headerHeight,
  onClose,
  isDark,
  menuBg,
  theme,
  toggleTheme,
  mounted,
}: {
  headerHeight: number
  onClose: () => void
  isDark: boolean
  menuBg: string
  theme: string | undefined
  toggleTheme: () => void
  mounted: boolean
}) {
  const textColor = isDark ? C.textDark : C.text
  const [isPressed, setIsPressed] = useState(false)

  /*
   * Calcolo dell'altezza dello switch quadrato per matchare la CTA.
   *
   * La CTA ha:
   * - font-size: 16px con line-height: 1 di default → 16px di altezza testo
   * - padding verticale: 10px sopra + 10px sotto = 20px
   * - border: 1px sopra + 1px sotto = 2px
   * - Totale: 16 + 20 + 2 = 38px
   *
   * Anche se nei calcoli teorici il valore sarebbe 38px, il rendering reale
   * del testo include leading verticale dipendente dal font (Inter, in questo
   * caso). Per garantire allineamento perfetto altezza-altezza, settiamo
   * 'alignItems: stretch' sul parent flex: lo switch eredita l'altezza della
   * CTA automaticamente, e la sua larghezza è poi forzata uguale all'altezza
   * tramite aspectRatio: 1 (quadrato perfetto, qualunque sia l'altezza reale).
   */
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 49,
        backgroundColor: menuBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflow: 'hidden',
      }}
      initial={{ height: 0 }}
      animate={{ height: '100dvh' }}
      exit={{ height: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Il padding-top spinge il contenuto sotto l'header */}
      <div
        style={{
          paddingTop: headerHeight,
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Voci di menu */}
        <div>
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'block',
                padding: '20px 16px',
                color: textColor,
                fontSize: '16px',
                fontFamily: 'var(--font-inter)',
                fontWeight: '500',
                letterSpacing: '-0.02em',
                textDecoration: 'none',
                // border-top sempre, border-bottom solo sull'ultimo
                borderTop: `1px solid ${
                  isDark ? 'rgba(229, 238, 255, 0.04)' : C.menuBorder
                }`,
                borderBottom:
                  index === NAV_ITEMS.length - 1
                    ? `1px solid ${
                        isDark ? 'rgba(229, 238, 255, 0.04)' : C.headerBorder
                      }`
                    : 'none',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/*
         * Sezione inferiore: CTA Contattami (sinistra) + switch tema (destra).
         *
         * Architettura del layout:
         * - display: flex con justifyContent: space-between → CTA a sinistra,
         *   switch all'estremo destro
         * - alignItems: stretch → lo switch eredita l'altezza della CTA, così
         *   sono sempre perfettamente allineati in verticale
         * - La CTA mantiene la sua larghezza naturale (data dal suo contenuto
         *   + padding) senza mai crescere
         * - Lo switch è un quadrato perfetto grazie a aspectRatio: 1, che lo
         *   forza a essere largo quanto è alto (cioè quanto la CTA)
         *
         * Con questa architettura non c'è più bisogno di un testo placeholder
         * "Light" invisibile: lo switch è icon-only e ha dimensioni costanti
         * indipendentemente dallo stato del tema.
         */}
        <div
          style={{
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* CTA Contattami — larghezza naturale, posizionata a sinistra */}
          <CTAButton onClick={onClose} />

          {/* Switch tema — quadrato (aspect-ratio 1:1), icon-only */}
          <button
            onClick={() => {
              setIsPressed(true)
              setTimeout(() => setIsPressed(false), 300)
              toggleTheme()
            }}
            aria-label={
              mounted && theme === 'dark'
                ? 'Passa alla modalità chiara'
                : 'Passa alla modalità scura'
            }
            style={{
              // aspectRatio: 1 forza il bottone a essere quadrato.
              // Combinato con alignItems: stretch sul parent, risulta
              // un quadrato di lato pari all'altezza della CTA.
              aspectRatio: '1 / 1',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: `1px solid ${isPressed ? C.primaryHover : C.secondary}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: isPressed ? C.primaryHover : C.primary,
              transition:
                'color 0.3s ease-in-out, border-color 0.3s ease-in-out',
            }}
          >
            {mounted && theme === 'dark' ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER — componente principale
// ─────────────────────────────────────────────────────────────────────────────

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const [isHoveringNav, setIsHoveringNav] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(60)
  const { theme, setTheme } = useTheme()
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMounted(true)

    const measureHeader = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height)
      }
    }

    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Se si torna su desktop, chiudi il menu mobile
      if (!mobile) setIsMenuOpen(false)
      measureHeader()
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    handleResize()
    handleScroll()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Ricalcola altezza header quando cambia stato (può cambiare la geometria)
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.getBoundingClientRect().height)
    }
  }, [isScrolled, isMobile])

  // Blocca lo scroll del body quando il menu mobile è aperto.
  // Questo previene il layout shift causato dalla scrollbar che
  // appare/scompare durante il cambio tema con menu aperto.
  useEffect(() => {
    if (isMenuOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflowY = 'scroll'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflowY = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflowY = ''
    }
  }, [isMenuOpen])

  // ── Valori derivati ────────────────────────────────────────────────────────

  // Su mobile: sempre floating. Su desktop: floating solo dopo scroll
  const isDesktopFloating = !isMobile && isScrolled
  const isFloating = isMobile || isDesktopFloating

  // Supportiamo mounted per evitare mismatch hydration con il tema
  const isDark = mounted && theme === 'dark'

  // Sfondo della card interna:
  // - Non floating: solido (dark o white) via CSS variable
  // - Floating in dark mode con menu aperto: dark navy solido
  // - Floating altrimenti: bianco semi-trasparente per il blur effect
  const innerCardBg = (() => {
    if (!isFloating) return 'var(--color-bg)'
    if (isDark && isMenuOpen) return '#0f1e2d'
    return 'rgba(255, 255, 254, 0.88)'
  })()

  // Colore del testo per nav e logo:
  // - Dark mode con menu aperto: bianco
  // - Floating: text scuro fisso (sfondo è bianco)
  // - Default: CSS variable (cambia con il tema)
  const textColor = (() => {
    if (isDark && isMenuOpen) return C.textDark
    if (isFloating) return C.text
    return 'var(--color-text)'
  })()

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <>
      {/* ── HEADER (sticky) ─────────────────────────────────────────────── */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 w-full"
        style={{
          // In light mode non-floating: bianco con border-bottom
          // In dark mode non-floating: dark navy
          // In floating: trasparente (il blur è sulla card interna)
          backgroundColor: !isFloating ? 'var(--color-bg)' : 'transparent',
          borderBottom:
            !isFloating && !isMobile
              ? `1px solid ${
                  isDark ? 'rgba(229, 238, 255, 0.1)' : C.headerBorder
                }`
              : 'none',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Container max-width — "il container dell'header" */}
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '8px' }}>
          {/* Card interna — "l'header vero e proprio" — quella che fluttua */}
          <motion.nav
            className="flex items-center justify-between"
            style={{
              paddingTop: '6px',
              paddingBottom: '6px',
              paddingLeft: !isMobile ? '16px' : '8px',
              paddingRight: '8px',

              borderRadius: isFloating ? '6px' : '2px',
              backgroundColor: innerCardBg,
              backdropFilter: isFloating ? 'blur(12px)' : 'none',
              WebkitBackdropFilter: isFloating ? 'blur(12px)' : 'none',
              transition:
                'background-color 0.3s ease, box-shadow 0.3s ease, border-radius 0.3s ease',
            }}
            animate={{
              marginTop: isDesktopFloating ? 10 : 0,
              boxShadow: isFloating && !isMenuOpen ? C.floatingShadow : 'none',
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* ── SINISTRA: Logo + Nav desktop ── */}
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/" aria-label="Torna alla home di MacrinoWeb">
                <MacrinoLogo />
              </Link>

              {/* Nav desktop — nascosta su mobile (lg:flex) */}
              <nav
                className="hidden lg:flex items-center"
                onMouseEnter={() => setIsHoveringNav(true)}
                onMouseLeave={() => {
                  setIsHoveringNav(false)
                  setHoveredNav(null)
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => setHoveredNav(item.href)}
                    onMouseLeave={() => setHoveredNav(null)}
                    style={{
                      color: textColor,
                      // Effetto Stripe: gli altri link vanno a 0.5 opacity
                      // quando ne stai hovering uno
                      opacity:
                        isHoveringNav && hoveredNav !== item.href ? 0.5 : 1,
                      padding: '8px 20px',
                      fontSize: '16px',
                      fontFamily: 'var(--font-inter)',
                      fontWeight: '500',
                      letterSpacing: '-0.02em',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      transition:
                        'opacity 0.3s ease-in-out, color 0.3s ease-in-out',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* ── DESTRA: Toggle tema + CTA + Hamburger ── */}
            <div className="flex items-center gap-3">
              {/* Toggle tema — solo desktop */}
              <button
                onClick={toggleTheme}
                className="hidden lg:flex items-center justify-center"
                aria-label={
                  mounted && theme === 'dark'
                    ? 'Passa alla modalità chiara'
                    : 'Passa alla modalità scura'
                }
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: textColor,
                  transition: 'color 0.3s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.accent
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = textColor
                }}
              >
                {/* mounted check: evita mismatch hydration.
                    Il server non conosce il tema → mostra sempre Moon.
                    Il client, dopo il mount, mostra l'icona corretta. */}
                {mounted && theme === 'dark' ? (
                  <Sun size={20} />
                ) : (
                  <Moon size={20} />
                )}
              </button>

              {/* CTA Contattami — solo desktop */}
              <div className="hidden lg:block">
                <CTAButton />
              </div>

              {/* Hamburger — solo mobile/tablet */}
              <div className="lg:hidden flex">
                <button
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-label={isMenuOpen ? 'Chiudi menu' : 'Apri menu'}
                  aria-expanded={isMenuOpen}
                  style={{
                    backgroundColor: C.hamburgerBg,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <HamburgerIcon isOpen={isMenuOpen} />
                </button>
              </div>
            </div>
          </motion.nav>
        </div>
      </header>

      {/* ── MOBILE MENU OVERLAY (fuori dall'header, z-49) ─────────────── */}
      {/*
       * AnimatePresence gestisce l'animazione di mount/unmount.
       * Senza di esso, l'animazione exit (saracinesca che risale)
       * non funzionerebbe perché React rimuove il componente
       * immediatamente senza aspettare l'animazione.
       */}
      <AnimatePresence>
        {isMenuOpen && (
          <MobileMenu
            headerHeight={headerHeight}
            onClose={() => setIsMenuOpen(false)}
            isDark={isDark}
            menuBg={innerCardBg}
            theme={theme}
            toggleTheme={toggleTheme}
            mounted={mounted}
          />
        )}
      </AnimatePresence>
    </>
  )
}
