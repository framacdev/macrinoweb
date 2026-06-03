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
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import MacrinoLogo from '@/components/ui/MacrinoLogo'
import AnimatedArrowIcon from '@/components/ui/AnimatedArrowIcon'
import { C } from '@/lib/constants'
import {
  primaryButtonStyle,
  primaryButtonForeground,
} from '@/lib/primaryButtonStyle'

// ─────────────────────────────────────────────────────────────────────────────
// COSTANTI — centralizzate qui per non ripetere stringhe e valori nei JSX
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Chi sono', href: '/chi-sono' },
  { label: 'Portfolio', href: '/portfolio' },
]

// ─────────────────────────────────────────────────────────────────────────────
// CTAButton — bottone "Contattami"
//
// È un <Link> Next.js che renderizza un <a> con stili da bottone.
// La sua larghezza è sempre quella naturale data dal contenuto + padding,
// senza mai crescere oltre, anche quando affiancato a uno switch quadrato
// nel mobile menu (gestito tramite justify-content: space-between sul parent).
// ─────────────────────────────────────────────────────────────────────────────

function CTAButton({
  isDark,
  onClick,
}: {
  isDark: boolean
  onClick?: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href="/contatti"
      onClick={onClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerCancel={() => setIsHovered(false)}
      style={{
        // Layout proprio della CTA (compatta, 16px). L'ASPETTO (fill, gradiente,
        // profondità, hover, foreground) arriva da primaryButtonStyle — stessa
        // single source del primary hero — ma SENZA alone (withHalo: false).
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '10px 28px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontWeight: '600',
        letterSpacing: '0.02em',
        fontSize: 16, 
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        ...primaryButtonStyle({ isDark, isHovered, withHalo: false }),
      }}
    >
      Contattami
      <AnimatedArrowIcon
        isHovered={isHovered}
        color={primaryButtonForeground()}
      />
    </Link>
  )
}

// HamburgerIcon — pattern "Spin" di hamburgers.css (Jonathan Suh) replicato con
// tre <motion.span> invece di pseudo-elementi. Le animazioni partono tutte
// insieme: l'occhio vede le barre avvitarsi fluidamente in una X.
//
// L'originale usa ::after figlio della centrale, che ne eredita la rotazione
// (225° del parent − 90° = 135°). Con tre sibling indipendenti "linearizzo":
// centrale 0°→225°, bottom 0°→135°. Entrambe orarie (Spin, non Vortex).
//
// I 225° invece di 45°: stessa posizione finale (mod 360°) ma percorso 5× più
// lungo → sensazione di vortice. Easing asimmetrico apertura/chiusura (ease-out
// vs ease-in cubico) per un movimento organico, non meccanico.

function HamburgerIcon({ isOpen, isDark }: { isOpen: boolean; isDark: boolean }) {
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
    // WHY: il nav card è near-white quando il menu è chiuso (anche in dark mode)
    // e navy solido quando è aperto. Le barre seguono il contrasto del fondo:
    // • menu open in dark → navy #0f1e2d → accent ciano (alto contrasto)
    // • tutti gli altri stati → card chiaro/bianco → primary blu (4.74:1 sul bianco)
    backgroundColor: isDark && isOpen ? C.accent : C.primary,
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
}: {
  headerHeight: number
  onClose: () => void
  isDark: boolean
  menuBg: string
  theme: string | undefined
  toggleTheme: () => void
}) {
  const textColor = isDark ? C.textDark : C.text
  const pathname = usePathname()
  const [isPressed, setIsPressed] = useState(false)
  const [isHoveringMobileNav, setIsHoveringMobileNav] = useState(false)
  const [mobileHoveredNav, setMobileHoveredNav] = useState<string | null>(null)

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
        {/* Voci di menu — stesso effetto "onda" della nav desktop (pointer / tap) */}
        <nav
          aria-label="Menu di navigazione"
          onPointerEnter={() => setIsHoveringMobileNav(true)}
          onPointerLeave={() => {
            setIsHoveringMobileNav(false)
            setMobileHoveredNav(null)
          }}
          onPointerCancel={() => {
            setIsHoveringMobileNav(false)
            setMobileHoveredNav(null)
          }}
        >
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              onClick={onClose}
              onPointerEnter={() => setMobileHoveredNav(item.href)}
              onPointerLeave={() => setMobileHoveredNav(null)}
              onPointerCancel={() => setMobileHoveredNav(null)}
              style={{
                display: 'block',
                padding: '20px 16px',
                color: textColor,
                fontSize: '16px',
                fontFamily: 'var(--font-body)',
                fontWeight: '500',
                letterSpacing: '-0.02em',
                textDecoration: 'none',
                opacity:
                  isHoveringMobileNav && mobileHoveredNav !== item.href
                    ? 0.5
                    : 1,
                transition: 'opacity 0.3s ease-in-out, color 0.3s ease-in-out',
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
        </nav>

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
          <CTAButton isDark={isDark} onClick={onClose} />

          {/* Switch tema — quadrato (aspect-ratio 1:1), icon-only */}
          <button
            onClick={() => {
              setIsPressed(true)
              setTimeout(() => setIsPressed(false), 300)
              toggleTheme()
            }}
            suppressHydrationWarning
            aria-label={
              theme === 'dark'
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
            {/* WHY: entrambe le icone nel DOM — CSS le mostra/nasconde via
                .dark su <html> (applicato da next-themes prima di React).
                Nessun conditional rendering → nessun hydration mismatch. */}
            <Moon size={18} className="block dark:hidden" />
            <Sun size={18} className="hidden dark:block" />
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
  // WHY: pathname per aria-current="page" sui link di navigazione —
  // indica agli screen reader qual è la pagina attiva corrente (WCAG 2.1).
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mountId = window.requestAnimationFrame(() => setMounted(true))

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
      cancelAnimationFrame(mountId)
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
  // - desktop non floating: var(--header-card-bg) = transparent (CSS)
  // - mobile (sempre floating): var(--header-card-bg) = rgba bianco (CSS)
  // - desktop floating (dopo scroll): rgba bianco (JS override)
  // - dark mode + menu aperto: navy solido (JS override, solo dopo interazione)
  const innerCardBg = (() => {
    if (isDark && isMenuOpen) return '#0f1e2d'
    if (isDesktopFloating) return 'rgba(255, 255, 254, 0.88)'
    return 'var(--header-card-bg)'
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
          // WHY: header trasparente — il wash --color-bg arriva dall'overlay
          // UNICO della HeroSection, che ha un bleed di --hero-nav-h e sale
          // anche dietro la navbar. Nessun position inline: lo `sticky` del
          // className non va sovrascritto.
          background: 'transparent',
          // WHY: var(--header-border) = 1px solid var(--color-header-border)
          // su desktop, none su mobile — corretto dal primo paint via CSS.
          // var(--color-header-border) cambia già con .dark (next-themes).
          // JS sovrascrive solo quando desktop va in floating (dopo scroll).
          borderBottom: isDesktopFloating ? 'none' : 'var(--header-border)',
          transition: 'border-color 0.3s ease',
        }}
      >
        {/* WHY: nessun overlay/gradient qui. Il wash --color-bg è UNO solo, in
            HeroSection: il suo overlay sul ribbon ha un bleed di --hero-nav-h
            (come poster e canvas) e copre già la fascia dietro l'header. Con la
            card trasparente a riposo (innerCardBg), header e hero mostrano lo
            stesso identico gradient: niente secondo layer da sincronizzare. */}
        {/* Container max-width — "il container dell'header" */}
        <div
          style={{
            maxWidth: 'var(--container-max)',
            margin: '0 auto',
            padding: '8px',
          }}
        >
          {/* Card interna — "l'header vero e proprio" — quella che fluttua */}
          <motion.nav
            className="flex items-center justify-between"
            style={{
              paddingTop: '6px',
              paddingBottom: '6px',
              // WHY: var(--header-card-pl) = 8px su mobile, 16px su desktop —
              // corretto dal primo paint, nessun flash da isMobile=false.
              paddingLeft: 'var(--header-card-pl)',
              paddingRight: '8px',

              // WHY: var(--header-card-radius/blur) = valori mobile dal CSS,
              // overridati da JS solo quando desktop va in floating.
              borderRadius: isDesktopFloating ? '6px' : 'var(--header-card-radius)',
              backgroundColor: innerCardBg,
              backdropFilter: isDesktopFloating ? 'blur(12px)' : 'var(--header-card-blur)',
              WebkitBackdropFilter: isDesktopFloating ? 'blur(12px)' : 'var(--header-card-blur)',
              // WHY: var(--header-card-shadow) = shadow su mobile dal CSS,
              // none su desktop. JS sovrascrive per menu-open e desktop-floating.
              boxShadow: isMenuOpen
                ? 'none'
                : isDesktopFloating
                  ? C.floatingShadow
                  : 'var(--header-card-shadow)',
              transition:
                'background-color 0.3s ease, box-shadow 0.3s ease, border-radius 0.3s ease',
            }}
            animate={{
              marginTop: isDesktopFloating ? 10 : 0,
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
                aria-label="Navigazione principale"
                className="hidden lg:flex items-center"
                onPointerEnter={() => setIsHoveringNav(true)}
                onPointerLeave={() => {
                  setIsHoveringNav(false)
                  setHoveredNav(null)
                }}
                onPointerCancel={() => {
                  setIsHoveringNav(false)
                  setHoveredNav(null)
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? 'page' : undefined}
                    onPointerEnter={() => setHoveredNav(item.href)}
                    onPointerLeave={() => setHoveredNav(null)}
                    onPointerCancel={() => setHoveredNav(null)}
                    style={{
                      color: textColor,
                      // Effetto onda: gli altri link vanno a 0.5 opacity
                      // quando ne stai hovering uno
                      opacity:
                        isHoveringNav && hoveredNav !== item.href ? 0.5 : 1,
                      padding: '8px 20px',
                      fontSize: '16px',
                      fontFamily: 'var(--font-body)',
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
                suppressHydrationWarning
                aria-label={
                  theme === 'dark'
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
                onPointerEnter={(e) => {
                  e.currentTarget.style.color = C.accent
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.color = textColor
                }}
                onPointerCancel={(e) => {
                  e.currentTarget.style.color = textColor
                }}
              >
                {/* WHY: entrambe le icone nel DOM — CSS le mostra/nasconde via
                    .dark su <html> (applicato da next-themes prima di React).
                    Nessun conditional rendering → nessun hydration mismatch. */}
                <Moon size={20} className="block dark:hidden" />
                <Sun size={20} className="hidden dark:block" />
              </button>

              {/* CTA Contattami — solo desktop */}
              <div className="hidden lg:block">
                <CTAButton isDark={isDark} />
              </div>

              {/* Hamburger — solo mobile/tablet */}
              <div className="lg:hidden flex">
                <button
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-label={isMenuOpen ? 'Chiudi menu' : 'Apri menu'}
                  aria-expanded={isMenuOpen}
                  style={{
                    // WHY: var(--hamburger-bg) = #e5eeff light, rgba(34,115,212,0.22)
                    // dark — applicato dal CSS prima di React (next-themes).
                    // Il dark usa tinta primary al 22%: visibile sia sul navy solido
                    // (menu open) che sulla nav glass (rgba bianco).
                    backgroundColor: 'var(--hamburger-bg)',
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
                  <HamburgerIcon isOpen={isMenuOpen} isDark={isDark} />
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
          />
        )}
      </AnimatePresence>
    </>
  )
}
