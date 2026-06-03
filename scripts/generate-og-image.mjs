// ─────────────────────────────────────────────────────────────────────────────
// generate-og-image.mjs
//
// Genera public/og-image.png (1200×630, standard LinkedIn/Facebook) componendo:
//   1. fondo paper quasi-bianco (--color-bg light)
//   2. il poster del ribbon desktop in cover (la "corrente")
//   3. un wash chiaro da sinistra per la leggibilità del testo
//   4. nome + ruolo
//
// La preview social era rotta: il file era referenziato in layout.tsx ma non
// esisteva. Rilancia con:  node scripts/generate-og-image.mjs
// ─────────────────────────────────────────────────────────────────────────────

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const RIBBON = join(ROOT, 'public', 'ribbon-fallback', 'herocanvasposter-desktop.png')
const OUT = join(ROOT, 'public', 'og-image.png')

const W = 1200
const H = 630

// Fondo paper + ribbon in cover.
const base = sharp({
  create: { width: W, height: H, channels: 4, background: '#fffffe' },
})
const ribbon = await sharp(RIBBON).resize(W, H, { fit: 'cover' }).png().toBuffer()

// Wash chiaro + testo come overlay SVG (font di sistema: l'OG non dipende da Sora).
const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stop-color="#fffffe" stop-opacity="0.96"/>
      <stop offset="0.55" stop-color="#fffffe" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fffffe" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wash)"/>
  <text x="80" y="300" font-family="sans-serif" font-size="76" font-weight="800" fill="#094067">Francesco Macrino</text>
  <text x="82" y="368" font-family="sans-serif" font-size="40" font-weight="600" fill="#2273d4">Web Developer</text>
  <text x="82" y="430" font-family="sans-serif" font-size="30" font-weight="400" fill="#5f6c7b">Design e sviluppo, dall'idea al risultato</text>
</svg>
`)

await base
  .composite([
    { input: ribbon, blend: 'over' },
    { input: overlay, blend: 'over' },
  ])
  .png()
  .toFile(OUT)

console.log(`og-image.png  ${W}x${H}  generata in public/`)
