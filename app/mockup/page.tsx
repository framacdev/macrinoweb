'use client'

import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'

/**
 * MOCKUP GRAFICO - MacrinoWeb
 * 
 * Questa pagina mostra una preview visiva di come potrebbe essere strutturato
 * l'intero sito con un approccio scrollytelling moderato.
 * 
 * NON è il codice finale - è solo una rappresentazione grafica per valutazione.
 */

// Palette estratta dal progetto
const LIGHT = {
  bg: '#FFFFFE',
  text: '#094067',
  body: '#5F6C7B',
  primary: '#2273D4',
  primaryHover: '#1A5BB8',
  accent: '#3DA9FC',
  border: '#E5EEFF',
  cardBg: '#FFFFFF',
}

const DARK = {
  bg: '#0F1E2D',
  text: '#FFFFFE',
  body: '#8899A8',
  primary: '#3DA9FC',
  primaryHover: '#2273D4',
  accent: '#3DA9FC',
  border: 'rgba(229, 238, 255, 0.08)',
  cardBg: 'rgba(255, 255, 255, 0.03)',
}

export default function MockupPage() {
  const [isDark, setIsDark] = useState(false)
  const colors = isDark ? DARK : LIGHT

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        color: colors.body,
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Theme Toggle Floating */}
      <button
        onClick={() => setIsDark(!isDark)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.cardBg,
          color: colors.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Mockup Label */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '8px 16px',
          backgroundColor: colors.primary,
          color: '#fff',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Mockup Preview
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEZIONE 1: HERO (rappresentazione)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          background: isDark 
            ? 'radial-gradient(ellipse at 50% 30%, rgba(61, 169, 252, 0.08) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(34, 115, 212, 0.06) 0%, transparent 60%)',
        }}
      >
        {/* Fake Header */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
            }}
          >
            <span style={{ color: colors.text, fontWeight: 700, fontSize: '18px' }}>
              MacrinoWeb
            </span>
            <nav style={{ display: 'flex', gap: '24px' }}>
              <span style={{ color: colors.body, fontSize: '15px' }}>Chi sono</span>
              <span style={{ color: colors.body, fontSize: '15px' }}>Portfolio</span>
            </nav>
          </div>
          <button
            style={{
              padding: '10px 24px',
              backgroundColor: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Contattami
          </button>
        </div>

        {/* Hero Content Placeholder */}
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <div
            style={{
              width: '280px',
              height: '280px',
              margin: '0 auto 40px',
              borderRadius: '50%',
              background: isDark
                ? 'linear-gradient(135deg, rgba(61, 169, 252, 0.2) 0%, rgba(34, 115, 212, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(34, 115, 212, 0.15) 0%, rgba(61, 169, 252, 0.08) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.body,
              fontSize: '14px',
            }}
          >
            [Canvas WebGL esistente]
          </div>
          <p style={{ color: colors.body, fontSize: '14px', opacity: 0.7 }}>
            La tua hero attuale con canvas interattivo
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: colors.body,
            opacity: 0.5,
          }}
        >
          <span style={{ fontSize: '12px', letterSpacing: '0.1em' }}>SCROLL</span>
          <div
            style={{
              width: '1px',
              height: '40px',
              background: `linear-gradient(to bottom, ${colors.body}, transparent)`,
            }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEZIONE 2: INTRO STATEMENT (Text Reveal)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
        }}
      >
        <div style={{ maxWidth: '900px', textAlign: 'center' }}>
          <p
            style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
            }}
          >
            Creo esperienze digitali che uniscono{' '}
            <span style={{ color: colors.primary }}>design</span>,{' '}
            <span style={{ color: colors.accent }}>performance</span> e{' '}
            <span
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              attenzione ai dettagli
            </span>
            .
          </p>
          <p
            style={{
              marginTop: '32px',
              fontSize: '16px',
              color: colors.body,
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
            }}
          >
            Ogni progetto nasce da un ascolto attento delle tue esigenze 
            e si trasforma in una soluzione web che funziona davvero.
          </p>

          {/* Annotation */}
          <div
            style={{
              marginTop: '60px',
              padding: '16px 24px',
              backgroundColor: isDark ? 'rgba(61, 169, 252, 0.1)' : 'rgba(34, 115, 212, 0.05)',
              borderRadius: '8px',
              borderLeft: `3px solid ${colors.accent}`,
              textAlign: 'left',
            }}
          >
            <p style={{ fontSize: '13px', color: colors.body, fontStyle: 'italic' }}>
              <strong style={{ color: colors.text }}>Scrollytelling:</strong> Il testo si rivela parola per parola 
              o riga per riga mentre l{"'"}utente scrolla. Effetto opacity/blur che si dissolve progressivamente.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEZIONE 3: SERVIZI (Card con parallax leggero)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: '120px 20px',
          backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(34, 115, 212, 0.02)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '60px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                color: colors.primary,
                textTransform: 'uppercase',
              }}
            >
              Servizi
            </span>
            <h2
              style={{
                marginTop: '12px',
                fontSize: 'clamp(32px, 4vw, 44px)',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '-0.02em',
              }}
            >
              Cosa posso fare per te
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {[
              {
                icon: '{ }',
                title: 'Sviluppo Web',
                desc: 'Siti web moderni, veloci e ottimizzati per ogni dispositivo. Next.js, React, performance-first.',
              },
              {
                icon: '~',
                title: 'UI/UX Design',
                desc: 'Interfacce intuitive che guidano l\'utente. Ogni pixel ha uno scopo, ogni interazione è studiata.',
              },
              {
                icon: '>_',
                title: 'Consulenza',
                desc: 'Analisi tecnica del tuo progetto esistente. Identifico colli di bottiglia e opportunità di miglioramento.',
              },
            ].map((service, i) => (
              <div
                key={i}
                style={{
                  padding: '40px 32px',
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(61, 169, 252, 0.1)' : 'rgba(34, 115, 212, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    color: colors.primary,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    fontSize: '18px',
                  }}
                >
                  {service.icon}
                </div>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: colors.text,
                    marginBottom: '12px',
                  }}
                >
                  {service.title}
                </h3>
                <p style={{ fontSize: '15px', color: colors.body, lineHeight: 1.6 }}>
                  {service.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Annotation */}
          <div
            style={{
              marginTop: '40px',
              padding: '16px 24px',
              backgroundColor: isDark ? 'rgba(61, 169, 252, 0.1)' : 'rgba(34, 115, 212, 0.05)',
              borderRadius: '8px',
              borderLeft: `3px solid ${colors.accent}`,
            }}
          >
            <p style={{ fontSize: '13px', color: colors.body, fontStyle: 'italic' }}>
              <strong style={{ color: colors.text }}>Scrollytelling:</strong> Le card entrano con fade + translateY 
              leggero (20px). Stagger timing di 100ms tra una card e l{"'"}altra. Hover con shadow elevata.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEZIONE 4: PORTFOLIO (Grid staggerato)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '120px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '60px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                color: colors.primary,
                textTransform: 'uppercase',
              }}
            >
              Portfolio
            </span>
            <h2
              style={{
                marginTop: '12px',
                fontSize: 'clamp(32px, 4vw, 44px)',
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '-0.02em',
              }}
            >
              Lavori selezionati
            </h2>
          </div>

          {/* Asymmetric Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gridTemplateRows: 'auto auto',
              gap: '24px',
            }}
          >
            {/* Project 1 - Large */}
            <div
              style={{
                gridRow: 'span 2',
                aspectRatio: '4/3',
                backgroundColor: isDark ? 'rgba(61, 169, 252, 0.08)' : 'rgba(34, 115, 212, 0.06)',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '32px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: colors.accent,
                    textTransform: 'uppercase',
                  }}
                >
                  E-commerce
                </span>
                <h3
                  style={{
                    marginTop: '8px',
                    fontSize: '24px',
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  Nome Progetto 1
                </h3>
                <div
                  style={{
                    marginTop: '16px',
                    width: '40px',
                    height: '2px',
                    backgroundColor: colors.accent,
                  }}
                />
              </div>
            </div>

            {/* Project 2 - Small */}
            <div
              style={{
                aspectRatio: '16/10',
                backgroundColor: isDark ? 'rgba(34, 115, 212, 0.1)' : 'rgba(61, 169, 252, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '24px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: colors.primary,
                    textTransform: 'uppercase',
                  }}
                >
                  Web App
                </span>
                <h3
                  style={{
                    marginTop: '8px',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  Nome Progetto 2
                </h3>
              </div>
            </div>

            {/* Project 3 - Small */}
            <div
              style={{
                aspectRatio: '16/10',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(9, 64, 103, 0.04)',
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '24px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: colors.accent,
                    textTransform: 'uppercase',
                  }}
                >
                  Landing Page
                </span>
                <h3
                  style={{
                    marginTop: '8px',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  Nome Progetto 3
                </h3>
              </div>
            </div>
          </div>

          {/* Annotation */}
          <div
            style={{
              marginTop: '40px',
              padding: '16px 24px',
              backgroundColor: isDark ? 'rgba(61, 169, 252, 0.1)' : 'rgba(34, 115, 212, 0.05)',
              borderRadius: '8px',
              borderLeft: `3px solid ${colors.accent}`,
            }}
          >
            <p style={{ fontSize: '13px', color: colors.body, fontStyle: 'italic' }}>
              <strong style={{ color: colors.text }}>Scrollytelling:</strong> I progetti appaiono con stagger 
              (150ms di delay tra ognuno). Hover: scale 1.02 dell{"'"}immagine, overlay con info progetto. 
              Layout asimmetrico per dinamismo visivo.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEZIONE 5: CHI SONO (Split layout con immagine pinned)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: '120px 20px',
          backgroundColor: isDark ? colors.bg : 'rgba(9, 64, 103, 0.02)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr',
              gap: '80px',
              alignItems: 'start',
            }}
          >
            {/* Image Column */}
            <div
              style={{
                position: 'sticky',
                top: '120px',
              }}
            >
              <div
                style={{
                  aspectRatio: '3/4',
                  backgroundColor: isDark ? 'rgba(61, 169, 252, 0.1)' : 'rgba(34, 115, 212, 0.08)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.body,
                  fontSize: '14px',
                }}
              >
                [Tua foto]
              </div>
              <p
                style={{
                  marginTop: '16px',
                  fontSize: '13px',
                  color: colors.body,
                  opacity: 0.7,
                  textAlign: 'center',
                }}
              >
                L{"'"}immagine resta fissa mentre il testo scrolla
              </p>
            </div>

            {/* Text Column */}
            <div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  color: colors.primary,
                  textTransform: 'uppercase',
                }}
              >
                Chi sono
              </span>
              <h2
                style={{
                  marginTop: '12px',
                  fontSize: 'clamp(32px, 4vw, 44px)',
                  fontWeight: 700,
                  color: colors.text,
                  letterSpacing: '-0.02em',
                }}
              >
                Francesco Macrino
              </h2>

              <div style={{ marginTop: '40px' }}>
                <p
                  style={{
                    fontSize: '17px',
                    color: colors.body,
                    lineHeight: 1.8,
                    marginBottom: '24px',
                  }}
                >
                  Sviluppatore web con una passione per le interfacce che funzionano davvero. 
                  Credo che ogni dettaglio conti e che la differenza tra un buon sito e un ottimo 
                  sito stia nelle piccole cose che l{"'"}utente non nota consapevolmente.
                </p>
                <p
                  style={{
                    fontSize: '17px',
                    color: colors.body,
                    lineHeight: 1.8,
                    marginBottom: '24px',
                  }}
                >
                  Lavoro principalmente con React e Next.js, ma non mi fermo alla tecnologia: 
                  ogni progetto parte da una comprensione profonda degli obiettivi di business 
                  e delle esigenze degli utenti finali.
                </p>
                <p
                  style={{
                    fontSize: '17px',
                    color: colors.body,
                    lineHeight: 1.8,
                    marginBottom: '24px',
                  }}
                >
                  Quando non scrivo codice, probabilmente sto esplorando nuove librerie di animazione, 
                  studiando pattern di UX o cercando ispirazione nei siti che visitano milioni di persone.
                </p>

                {/* Skills/Tech tags */}
                <div style={{ marginTop: '40px' }}>
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: colors.text,
                      marginBottom: '16px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Stack tecnologico
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['React', 'Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'Three.js'].map(
                      (tech) => (
                        <span
                          key={tech}
                          style={{
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: colors.primary,
                            backgroundColor: isDark
                              ? 'rgba(61, 169, 252, 0.1)'
                              : 'rgba(34, 115, 212, 0.08)',
                            borderRadius: '6px',
                          }}
                        >
                          {tech}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Annotation */}
          <div
            style={{
              marginTop: '60px',
              padding: '16px 24px',
              backgroundColor: isDark ? 'rgba(61, 169, 252, 0.1)' : 'rgba(34, 115, 212, 0.05)',
              borderRadius: '8px',
              borderLeft: `3px solid ${colors.accent}`,
            }}
          >
            <p style={{ fontSize: '13px', color: colors.body, fontStyle: 'italic' }}>
              <strong style={{ color: colors.text }}>Scrollytelling:</strong> L{"'"}immagine resta "pinned" (position: sticky) 
              mentre il contenuto testuale a destra scorre. Crea un effetto di profondità e dinamismo senza essere invasivo.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SEZIONE 6: CONTATTI (CTA finale)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: '160px 20px',
          textAlign: 'center',
          backgroundColor: isDark ? 'rgba(61, 169, 252, 0.03)' : 'rgba(34, 115, 212, 0.03)',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Parliamo del tuo progetto?
          </h2>
          <p
            style={{
              marginTop: '24px',
              fontSize: '18px',
              color: colors.body,
              lineHeight: 1.7,
            }}
          >
            Sono sempre aperto a nuove collaborazioni e sfide interessanti. 
            Raccontami la tua idea.
          </p>
          <button
            style={{
              marginTop: '48px',
              padding: '16px 40px',
              backgroundColor: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Contattami
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8H13M13 8L9 4M13 8L9 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          padding: '40px 20px',
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <p style={{ fontSize: '14px', color: colors.body }}>
            2026 MacrinoWeb. Tutti i diritti riservati.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span style={{ fontSize: '14px', color: colors.body, cursor: 'pointer' }}>Privacy</span>
            <span style={{ fontSize: '14px', color: colors.body, cursor: 'pointer' }}>LinkedIn</span>
            <span style={{ fontSize: '14px', color: colors.body, cursor: 'pointer' }}>GitHub</span>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════════
          SUMMARY BOX
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          maxWidth: '400px',
          padding: '20px 24px',
          backgroundColor: isDark ? '#1a2d3d' : '#fff',
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          zIndex: 999,
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '12px' }}>
          Riepilogo Scrollytelling
        </p>
        <ul style={{ fontSize: '13px', color: colors.body, lineHeight: 1.6, paddingLeft: '16px' }}>
          <li>Intro: text reveal word-by-word</li>
          <li>Servizi: fade + translateY con stagger</li>
          <li>Portfolio: grid asimmetrico + stagger</li>
          <li>Chi sono: immagine sticky/pinned</li>
          <li>Contatti: sezione statica, pulita</li>
        </ul>
      </div>
    </div>
  )
}
