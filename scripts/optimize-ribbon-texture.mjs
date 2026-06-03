// ─────────────────────────────────────────────────────────────────────────────
// optimize-ribbon-texture.mjs
//
// Converte la palette sorgente del ribbon (assets/textures/ribbon3.png, fuori
// da public/ così il PNG da 822KB non viene deployato) nel WebP servito in
// public/textures/ribbon3.webp. La texture è un gradiente morbido campionato per
// UV dallo shader: in WebP scende di un ordine di grandezza senza differenze
// percepibili. Dimensioni invariate (nessun ricampionamento → nessun cambio di
// colore). Il loader in HeroCanvasCore punta a ribbon3.webp.
//
//   node scripts/optimize-ribbon-texture.mjs
// ─────────────────────────────────────────────────────────────────────────────

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'assets', 'textures', 'ribbon3.png')
const OUT = join(ROOT, 'public', 'textures', 'ribbon3.webp')

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)}KB`

const { width, height } = await sharp(SRC).metadata()

await sharp(SRC)
  // effort 6 = compressione massima; quality 90 su un gradiente morbido è
  // visivamente lossless. Niente resize: stesse dimensioni del sorgente.
  .webp({ quality: 90, effort: 6 })
  .toFile(OUT)

console.log(`ribbon3.png  ${width}x${height}  ${kb(SRC)}  →  ribbon3.webp  ${kb(OUT)}`)
