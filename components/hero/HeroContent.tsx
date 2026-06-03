'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useTheme } from 'next-themes'
import Button from '@/components/ui/Button'
import { C } from '@/lib/constants'

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

// ease-out (non easeInOut): per gli ingressi il movimento decelera verso la
// posizione finale, più naturale di una curva simmetrica.
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

// In reduced-motion l'entrata diventa un semplice crossfade: niente movimento
// di posizione, solo opacità. Prima copriva solo il LED, non l'ingresso (P2).
const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'linear' } },
}

export default function HeroContent() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const isDark = mounted && theme === 'dark'
  const item = prefersReducedMotion ? itemVariantsReduced : itemVariants

  // WHY: token del LED "online" derivati dalla palette. mid = colore del LED
  // (l'accent #3da9fc su entrambi i temi, per coerenza con il brand), edge =
  // bordo scuro della pallina di vetro, glow = rgb dell'accent per i tre anelli
  // di bloom. core = punto caldo: una tinta azzurrina (non bianco pieno) così
  // il LED resta acceso ma meno "fotorealistico". L'edge cambia per tema solo
  // per dare il giusto contrasto del rim sul fondo scuro vs chiaro.
  const led = isDark
    ? { core: '#CDE8FF', mid: C.accent, edge: '#1E6FCB', glow: '61,169,252' }
    : {
        core: '#D6ECFF',
        mid: C.accent,
        edge: C.primaryHover,
        glow: '61,169,252',
      }

  // WHY: gloss interna costante (riflesso in alto sulla pallina) + i tre anelli
  // di glow. Lo stato "basso" e "alto" servono al respiro del LED: in reduced
  // motion resto fisso sullo stato alto (acceso, leggibile, nessuna animazione).
  // gloss attenuata (0.45) e high con raggi/spread ridotti = bordo bianco più
  // discreto e alone pulsante meno espanso.
  const ledGloss = 'inset 0 0.6px 1.2px rgba(255,255,255,0.45)'
  const ledGlowLow = `${ledGloss}, 0 0 3px 1px rgba(${led.glow},0.70), 0 0 6px 2px rgba(${led.glow},0.36), 0 0 11px 3px rgba(${led.glow},0.14)`
  const ledGlowHigh = `${ledGloss}, 0 0 4px 1.5px rgba(${led.glow},0.92), 0 0 9px 3px rgba(${led.glow},0.50), 0 0 16px 5px rgba(${led.glow},0.24)`

  return (
    // WHY: contenuto IN-FLOW (non più position:absolute) — è ciò che dà l'altezza
    // alla section, che usa min-height come floor (vedi HeroSection). Quando il
    // copy supera il viewport (mobile landscape) la section cresce e niente
    // trabocca. NIENTE position/z-index/transform su questa catena di wrapper:
    // creerebbe uno stacking context e impedirebbe al mix-blend-mode del
    // paragrafo di fondere col ribbon (z-index:-1) dipinto dietro.
    <div className="w-full flex justify-center">
      {/* div intermedio: container a 1300px, stessa griglia delle future section.
          Il padding-top di --hero-copy-pad spinge il copy sotto la navbar.
          maxWidth/padding restano inline: il padding è una CSS var responsiva. */}
      <div
        className="w-full"
        style={{
          maxWidth: '1300px',
          padding: 'var(--hero-copy-pad)',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
          }}
        >
          {/* ── Badge ──────────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                padding: '6px 16px',
                borderRadius: '999px',
                // WHY: blur più alto + saturate/brightness = vetro più "spesso" e
                // brillante, che rifrange i colori del canvas dietro (effetto acqua).
                backdropFilter: 'blur(24px) saturate(1.8) brightness(1.05)',
                WebkitBackdropFilter:
                  'blur(24px) saturate(1.8) brightness(1.05)',
                border: `1px solid ${isDark ? 'rgba(120,180,255,0.40)' : 'rgba(34,115,212,0.32)'}`,
                // WHY: due layer di riempimento. Il radial in alto-sinistra è il
                // riflesso speculare della sorgente di luce sulla cresta del vetro;
                // il linear verticale dà la convessità (luce in alto, ombra sotto).
                // Insieme leggono come una superficie bombata e bagnata, non piatta.
                backgroundImage: isDark
                  ? `radial-gradient(140% 120% at 18% -15%, rgba(150,195,255,0.34) 0%, rgba(150,195,255,0) 45%),
                     linear-gradient(180deg, rgba(72,112,168,0.50) 0%, rgba(16,32,57,0.50) 100%)`
                  : `radial-gradient(140% 120% at 18% -15%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0) 46%),
                     linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(220,233,251,0.70) 100%)`,
                // highlight interna sul bordo superiore: simula la cresta di luce
                // del vetro. Più tenue in dark (0.30) per non bruciare sul navy.
                boxShadow: isDark
                  ? 'inset 0 1px 0.5px rgba(255,255,255,0.30)'
                  : 'inset 0 1px 0.5px rgba(255,255,255,1)',
              }}
            >
              {/* WHY: pallina di vetro neon. Il radial-gradient costruisce la bead
                  3D (core caldo in alto-sx → colore LED → bordo scuro), mentre il
                  box-shadow anima il "respiro" del glow. */}
              <motion.span
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { boxShadow: [ledGlowLow, ledGlowHigh, ledGlowLow] }
                }
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  display: 'inline-block',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  backgroundImage: `radial-gradient(circle at 35% 28%, ${led.core} 0%, ${led.mid} 45%, ${led.edge} 100%)`,
                  boxShadow: ledGlowHigh,
                }}
              />
              <span
                style={{
                  // WHY: JetBrains Mono earned nel badge — il LED + pill mono
                  // legge come status indicator da terminale, segnale "dev"
                  // confinato all'unico elemento dove ha senso semantico.
                  // clamp 13→15px: mono è più largo di Nunito, parte da 13px
                  // (un solo px sopra il precedente fisso) per mantenere
                  // l'equilibrio visivo del pill su mobile.
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.722rem, 1.5vw, 0.833rem)',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  // WHY: navy #094067 in light = contrasto ~8:1 sul vetro chiaro,
                  // ben oltre la soglia 4.5:1 anche sopra il canvas animato.
                  color: isDark ? 'var(--color-text)' : C.text,
                }}
              >
                {/* Desktop: testo completo — Mobile (<640px): versione breve */}
                <span className="hidden sm:inline">Disponibile · freelance / full-time</span>
                <span className="sm:hidden">Disponibile · full-time</span>
              </span>
            </div>
          </motion.div>

          {/* ── H1 ─────────────────────────────────────────────────────── */}
          <motion.h1
            variants={item}
            style={{
              maxWidth: 1050,
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.222rem, 5.5vw, 3.333rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              margin: 0,
              color: isDark ? 'var(--color-text)' : C.text,
              textWrap: 'balance',
            } as React.CSSProperties}
          >
            Design e sviluppo, dall&apos;idea al{' '}
            {/* WHY: gradiente confinato alla sola parola "risultato".
                `color` è il fallback non-trasparente (WCAG).
                Dark: bianco a sinistra per continuità col testo
                circostante, poi ciano→blu (la parola "scende" in
                profondità). Light: navy→primary→ciano. */}
            <span
              style={{
                color: isDark ? C.accent : C.primary,
                backgroundImage: isDark
                  ? 'linear-gradient(90deg, var(--color-text) 0%, #2273D4 55%, #3FC8FF 100%)'
                  : 'linear-gradient(90deg, #094067 0%, #2273D4 50%, #3FC8FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              risultato
            </span>
          </motion.h1>

          {/* ── Paragrafo ──────────────────────────────────────────────── */}
          <motion.p
            variants={item}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
              fontWeight: 600, // WHY: 600 (era 500) — aumenta contrasto gerarchico con Sora 800
              lineHeight: 1.2,
              margin: 0,
              maxWidth: 1050,
              // WHY: --color-body-hero (#5C7CA6 in light, #fffffe in dark) è
              // dichiarato in globals.css e si adatta al tema via CSS variable,
              // senza dipendere da JS. In light mode multiply fa sì che il testo
              // assorba i colori del ribbon dove il canvas è colorato (si tinge
              // del blu/ciano del ribbon), restando sul grigio-blu di base dove
              // il canvas è trasparente. In dark multiply non viene applicato
              // perché moltiplicare testo chiaro su sfondo scuro produce testo
              // invisibile: #fffffe viene mostrato direttamente senza blend.
              color: 'var(--color-body-hero)',
              mixBlendMode: isDark ? undefined : 'multiply',
            }}
          >
            Progetto e realizzo esperienze web curate nei dettagli, fluide
            nell&apos;uso e veloci nelle performance. Disponibile per
            opportunità lavorative e progetti freelance.
          </motion.p>

          {/* ── Bottoni ────────────────────────────────────────────────── */}
          {/* WHY: classe hero-cta (non inline) per le regole responsive in
              globals.css — i <Button> sono componenti senza prop style, così il
              selettore discendente li raggiunge senza toccarne l'API. flexDirection
              e flex-wrap NON sono inline (vincerebbero sulle media query): il
              default è row + nowrap (→ unica row garantita), e le media query
              passano a flex:1 (<640px) e a colonna full-width (<389px). */}
          <motion.div
            className="hero-cta"
            variants={item}
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: 8,
            }}
          >
            <Button variant="primary" label="Parliamone" href="#contatti" />
            <Button variant="secondary" label="Vedi i progetti" href="#portfolio" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
