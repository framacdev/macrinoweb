'use client'

/**
 * FeaturedProject — sezione "Progetto in evidenza".
 *
 * WHY placeholder: non c'è ancora un progetto reale da mostrare. La struttura è
 * pronta (titolo + glass card con visual, testo, tag, status), il contenuto è
 * segnaposto e dichiarato tale ("Presto disponibile"). Fine-tuning visivo dopo il
 * primo feedback. Sfondo trasparente: la sezione poggia sul gradiente .depth.
 *
 * WHY niente eyebrow: il sistema (DESIGN.md) vieta l'eyebrow uppercase tracciato
 * sopra le sezioni — è un tell da template AI. La sezione si identifica dall'H2 e
 * dall'ancora #portfolio (CTA hero "Vedi i progetti").
 *
 * La card è un <TiltCard>: vetro + tilt 3D + bordo illuminato che seguono il
 * cursore, primitivo riusato anche dalle future card della sezione portfolio.
 */

import { useEffect, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useTheme } from 'next-themes'

import { C } from '@/lib/constants'
import TiltCard from '@/components/ui/TiltCard'

// Stack segnaposto del progetto — sostituibile quando il progetto reale esisterà.
const TAGS = ['Next.js', 'TypeScript', 'Three.js', 'Framer Motion'] as const

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'linear' } },
}

export default function FeaturedProject() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const isDark = mounted && theme === 'dark'
  const item = prefersReducedMotion ? itemVariantsReduced : itemVariants

  return (
    <section
      id="portfolio"
      // scroll-margin: l'ancora #portfolio (CTA hero) non finisce sotto l'header sticky
      style={{ scrollMarginTop: 96 }}
    >
      <div
        className="section-shell"
        style={{
          paddingBlock: 'clamp(72px, 12vh, 140px)',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* ── Titolo ───────────────────────────────────────────────────── */}
          <motion.h2
            variants={item}
            style={{
              margin: 0,
              maxWidth: 720,
              color: 'var(--color-text)',
              textWrap: 'balance',
            }}
          >
            Progetto in evidenza
          </motion.h2>

          {/* ── Sottotitolo ──────────────────────────────────────────────── */}
          <motion.p
            variants={item}
            style={{
              margin: 0,
              maxWidth: 1050,
              fontSize: 'clamp(1.15rem, 0.95rem + 1vw, 1.4rem)',
              lineHeight: 1.55,
              color: 'var(--color-body)',
            }}
          >
            Una selezione del lavoro che meglio racconta come progetto e
            costruisco esperienze web. Il primo caso studio sta per arrivare.
          </motion.p>

          {/* ── Glass card (segnaposto) ──────────────────────────────────── */}
          <motion.div variants={item} style={{ marginTop: 16 }}>
            <TiltCard className="featured-card">
              {/* — Visual: pannello segnaposto, niente cromo da finestra OS — */}
              <div
                aria-hidden
                style={{
                  position: 'relative',
                  minHeight: 280,
                  overflow: 'hidden',
                  // superficie + dot-grid finissima (blueprint, precisione)
                  backgroundImage: isDark
                    ? `radial-gradient(circle at center, rgba(150,195,255,0.07) 1px, transparent 1.6px),
                       linear-gradient(135deg, rgba(34,115,212,0.18), rgba(16,32,57,0.30))`
                    : `radial-gradient(circle at center, rgba(34,115,212,0.08) 1px, transparent 1.6px),
                       linear-gradient(135deg, rgba(61,169,252,0.20), rgba(34,115,212,0.14))`,
                  backgroundSize: '22px 22px, cover',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.833rem',
                    letterSpacing: '0.08em',
                    color: isDark
                      ? 'rgba(241,246,255,0.62)'
                      : 'rgba(9,64,103,0.55)',
                  }}
                >
                  Presto disponibile
                </span>
                {/* sweep: highlight diagonale che attraversa lento la superficie */}
                {!prefersReducedMotion ? (
                  <motion.div
                    aria-hidden
                    initial={{ x: '-130%' }}
                    animate={{ x: '130%' }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      repeatDelay: 1.4,
                      ease: 'easeInOut',
                    }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)',
                      pointerEvents: 'none',
                    }}
                  />
                ) : null}
              </div>

              {/* — Testo del progetto — */}
              <div
                style={{
                  padding: 'clamp(22px, 3vw, 36px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  justifyContent: 'center',
                }}
              >
                <h3 style={{ margin: 0, color: 'var(--color-text)' }}>
                  Case study in arrivo
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: 'var(--color-body)',
                  }}
                >
                  Qui vivrà il progetto in evidenza: contesto, sfida, soluzione
                  e risultati misurabili. Per ora questo è un segnaposto della
                  struttura — il contenuto reale seguirà.
                </p>

                {/* tag stack */}
                <ul
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {TAGS.map((tag) => (
                    <li
                      key={tag}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 999,
                        fontSize: '0.833rem',
                        fontWeight: 600,
                        color: isDark ? 'var(--color-text)' : C.primary,
                        border: `1px solid ${
                          isDark
                            ? 'rgba(120,180,255,0.22)'
                            : 'rgba(34,115,212,0.22)'
                        }`,
                        background: isDark
                          ? 'rgba(120,180,255,0.08)'
                          : 'rgba(34,115,212,0.06)',
                      }}
                    >
                      {tag}
                    </li>
                  ))}
                </ul>

                {/* status segnaposto: non è un link (nessun progetto), è uno stato */}
                <div style={{ marginTop: 6 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 999,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.833rem',
                      letterSpacing: '0.04em',
                      color: isDark
                        ? 'rgba(241,246,255,0.7)'
                        : 'rgba(9,64,103,0.7)',
                      border: `1px dashed ${
                        isDark
                          ? 'rgba(120,180,255,0.3)'
                          : 'rgba(34,115,212,0.32)'
                      }`,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: C.accent,
                        flexShrink: 0,
                      }}
                    />
                    In lavorazione
                  </span>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
