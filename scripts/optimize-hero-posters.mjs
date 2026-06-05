// ─────────────────────────────────────────────────────────────────────────────
// optimize-hero-posters.mjs
//
// Genera i poster di fallback SERVITI (AVIF + WebP) dai master PNG catturati da
// /ribbon-capture.
//   master (sorgente, NON deployati): assets/hero-posters/herocanvasposter-{key}.png
//   output (serviti):                 public/ribbon-fallback/herocanvasposter-{key}.{avif,webp}
//
// AVIF q60 = primario (~metà dei byte, niente banding del webp); WebP q82 =
// fallback per Safari < 16.4. Niente resize: stesse dimensioni del master.
// File statici → portabili su qualsiasi host, nessuna ottimizzazione runtime.
//
//   node scripts/optimize-hero-posters.mjs     (oppure: npm run posters)
// ─────────────────────────────────────────────────────────────────────────────

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'assets', 'hero-posters')
const OUT = join(ROOT, 'public', 'ribbon-fallback')
const KEYS = ['landscape', 'sportrait', 'tablet', 'lgtablet', 'desktop']

const kb = (p) => `${(statSync(p).size / 1024).toFixed(0)}KB`

for (const k of KEYS) {
  const src = join(SRC, `herocanvasposter-${k}.png`)
  const avif = join(OUT, `herocanvasposter-${k}.avif`)
  const webp = join(OUT, `herocanvasposter-${k}.webp`)
  await sharp(src).avif({ quality: 60, effort: 6 }).toFile(avif)
  await sharp(src).webp({ quality: 82, effort: 6 }).toFile(webp)
  console.log(
    `${k.padEnd(10)} avif ${kb(avif).padStart(6)}  webp ${kb(webp).padStart(6)}`
  )
}
