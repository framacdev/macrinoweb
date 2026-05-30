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

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
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
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* WHY: div intermedio centrato a 1300px — il wrapper assoluto copre
          tutta la section, questo div allinea il copy alla stessa griglia
          usata dalle future section del sito senza toccare il layout globale. */}
      <div
        style={{
          width: '100%',
          maxWidth: '1300px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          // WHY: --hero-copy-pad (vedi globals.css) garantisce che il contenuto
          // parta sotto la navbar senza misurazioni JS ed è responsivo: desktop
          // calc(--hero-nav-h + 48px) 24px 24px → ≤1024px calc(--hero-nav-h + 8px) 16px 16px.
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
          <motion.div variants={itemVariants}>
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
                // WHY: cinque livelli per il volume del vetro — highlight interna
                // sul bordo superiore (cresta), velo chiaro laterale sx (rifrazione
                // del bordo), ombra interna sul fondo, drop shadow ravvicinata per
                // l'elevazione, alone diffuso colorato per la profondità.
                boxShadow: isDark
                  ? ['inset 0 1px 0.5px rgba(255,255,255,0.30)'].join(', ')
                  : ['inset 0 1px 0.5px rgba(255,255,255,1)'].join(', '),
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
                  fontFamily: 'var(--font-inter)',
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  // WHY: navy #094067 in light = contrasto ~8:1 sul vetro chiaro,
                  // ben oltre la soglia 4.5:1 anche sopra il canvas animato.
                  color: isDark ? '#FFFFFE' : C.text,
                }}
              >
                Freelance {'&'} open to work
              </span>
            </div>
          </motion.div>

          {/* ── H1 ─────────────────────────────────────────────────────── */}
          <motion.h1
            variants={itemVariants}
            style={{
              maxWidth: 950,
              fontFamily: 'var(--font-plus-jakarta)',
              fontSize: 'clamp(2rem, 5vw, 3.111rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              margin: 0,
              // WHY: backgroundImage invece di background (shorthand) per evitare
              // il conflitto React con backgroundClip — shorthand e longhand non
              // possono coesistere nello stesso style object durante i re-render.
              backgroundImage: isDark
                ? 'linear-gradient(90deg, #2273D4 0%, #3FC8FF 70%, #FFFFFE 100%)'
                : 'linear-gradient(90deg, #094067 0%, #2273D4 50%, #3FC8FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Design e sviluppo, dall&apos;idea al risultato
          </motion.h1>

          {/* ── Paragrafo ──────────────────────────────────────────────── */}
          <motion.p
            variants={itemVariants}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
              fontWeight: 500,
              lineHeight: 1.2,
              margin: 0,
              maxWidth: 950,
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
            variants={itemVariants}
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: 8,
            }}
          >
            <Button variant="primary" label="Iniziamo" href="#contatti" />
            <Button
              variant="secondary"
              label="Vedi i progetti"
              href="#portfolio"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
