/**
 * palette-texture.ts
 *
 * Genera la "palette texture" 1D che lo shader del ribbon usa come gradient
 * di colori lungo l'asse X del nastro.
 *
 * Stripe usa una texture data (genericamente 1×N o N×1 pixel) dove ogni
 * pixel è un colore del gradient. Il fragment shader fa texture2D(palette, uv.x)
 * per leggere il colore alla posizione X del nastro.
 *
 * INTERPOLAZIONE OKLAB:
 * Linear RGB blending (quello che fa mix() di GLSL su sRGB) è percettivamente
 * sbagliato — interpolare blu→rosso passa per un grigiastro fango. OKLab è
 * uno spazio colore percettivamente uniforme; interpolare lì dà transizioni
 * sature e naturali. È la stessa funzione che lo shader Stripe importa
 * (oklab_mix), ma noi la calcoliamo in CPU una sola volta per generare
 * la texture, evitando di farla per ogni fragment.
 *
 * Implementazione: Inigo Quilez (https://www.shadertoy.com/view/ttcyRS)
 */

import * as THREE from 'three'

// Matrici di conversione cone↔LMS (camera del modello OKLab)
// CONEtoLMS: linear sRGB → LMS (cone response)
const kCONEtoLMS = [
  0.4121656120, 0.2118591070, 0.0883097947,
  0.5362752080, 0.6807189584, 0.2818474174,
  0.0514575653, 0.1074065790, 0.6302613616,
]
// LMStoCONE: LMS → linear sRGB
const kLMStoCONE = [
  4.0767245293, -1.2681437731, -0.0041119885,
  -3.3072168827, 2.6093323231, -0.7034763098,
  0.2307590544, -0.3411344290, 1.7068625689,
]

/**
 * Mix di due colori in spazio OKLab (percettivamente uniforme).
 * Input: due colori RGB in [0,1] linear, e a in [0,1] (peso del mix).
 * Output: colore RGB linear interpolato.
 */
function oklabMix(c1: [number, number, number], c2: [number, number, number], a: number): [number, number, number] {
  // Step 1: linear → LMS
  const lms1 = [
    kCONEtoLMS[0]*c1[0] + kCONEtoLMS[3]*c1[1] + kCONEtoLMS[6]*c1[2],
    kCONEtoLMS[1]*c1[0] + kCONEtoLMS[4]*c1[1] + kCONEtoLMS[7]*c1[2],
    kCONEtoLMS[2]*c1[0] + kCONEtoLMS[5]*c1[1] + kCONEtoLMS[8]*c1[2],
  ]
  const lms2 = [
    kCONEtoLMS[0]*c2[0] + kCONEtoLMS[3]*c2[1] + kCONEtoLMS[6]*c2[2],
    kCONEtoLMS[1]*c2[0] + kCONEtoLMS[4]*c2[1] + kCONEtoLMS[7]*c2[2],
    kCONEtoLMS[2]*c2[0] + kCONEtoLMS[5]*c2[1] + kCONEtoLMS[8]*c2[2],
  ]
  // Step 2: cube root (la non-linearità di OKLab)
  const lms1c = lms1.map(v => Math.cbrt(v)) as [number, number, number]
  const lms2c = lms2.map(v => Math.cbrt(v)) as [number, number, number]
  // Step 3: mix lineare in OKLab
  const lms = [
    lms1c[0] + a*(lms2c[0] - lms1c[0]),
    lms1c[1] + a*(lms2c[1] - lms1c[1]),
    lms1c[2] + a*(lms2c[2] - lms1c[2]),
  ]
  // Boost di saturazione (Quilez aggiunge un nudge per evitare fade troppo morto)
  const boost = 1.0 + 0.2 * a * (1.0 - a)
  lms[0] *= boost; lms[1] *= boost; lms[2] *= boost
  // Step 4: cube (inverso della cube root)
  const lmsCubed = [lms[0]**3, lms[1]**3, lms[2]**3]
  // Step 5: LMS → linear RGB
  return [
    kLMStoCONE[0]*lmsCubed[0] + kLMStoCONE[3]*lmsCubed[1] + kLMStoCONE[6]*lmsCubed[2],
    kLMStoCONE[1]*lmsCubed[0] + kLMStoCONE[4]*lmsCubed[1] + kLMStoCONE[7]*lmsCubed[2],
    kLMStoCONE[2]*lmsCubed[0] + kLMStoCONE[5]*lmsCubed[1] + kLMStoCONE[8]*lmsCubed[2],
  ]
}

/**
 * Converte hex string ("#2273D4") → [r, g, b] in [0,1] linear.
 * Three.js Color usa sRGB per default; per OKLab serve linear.
 */
function hexToLinearRGB(hex: string): [number, number, number] {
  const c = new THREE.Color(hex)
  c.convertSRGBToLinear()
  return [c.r, c.g, c.b]
}

/**
 * Converte un valore [0,1] linear in [0,255] sRGB byte (per scrittura su DataTexture).
 */
function linearToSRGBByte(v: number): number {
  // Inverse gamma sRGB approssimata
  const clamped = Math.max(0, Math.min(1, v))
  const srgb = clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1/2.4) - 0.055
  return Math.round(srgb * 255)
}

/**
 * Genera la palette texture come THREE.DataTexture.
 *
 * Input: array di stop, ognuno = { color: '#hex', position: 0..1 }.
 * Output: DataTexture 1D di width pixel × 1 pixel di altezza.
 *
 * La texture è in formato RGBA UNSIGNED_BYTE (4 bytes per pixel).
 * Width default 256 → ~256 colori discreti nel gradient. Per gradient
 * smooth bastano, lo shader interpola comunque tra pixel adiacenti via
 * linearFilter.
 */
export function createPaletteTexture(
  stops: Array<{ color: string; position: number }>,
  width: number = 256,
): THREE.DataTexture {
  // Validazione: almeno 2 stops, position ordinati
  if (stops.length < 2) throw new Error('Palette needs at least 2 stops')
  const sorted = [...stops].sort((a, b) => a.position - b.position)

  // Pre-converto tutti gli stops in linear RGB
  const linearStops = sorted.map(s => ({
    color: hexToLinearRGB(s.color),
    position: s.position,
  }))

  const data = new Uint8Array(width * 4)
  for (let i = 0; i < width; i++) {
    const u = i / (width - 1) // [0, 1]

    // Trova i due stops che contengono u
    let leftIdx = 0
    for (let j = 0; j < linearStops.length - 1; j++) {
      if (linearStops[j].position <= u && u <= linearStops[j+1].position) {
        leftIdx = j
        break
      }
    }
    const left = linearStops[leftIdx]
    const right = linearStops[Math.min(leftIdx + 1, linearStops.length - 1)]

    // Mix locale tra i due stops
    const localT = right.position === left.position
      ? 0
      : (u - left.position) / (right.position - left.position)
    const mixed = oklabMix(left.color, right.color, localT)

    data[i*4 + 0] = linearToSRGBByte(mixed[0])
    data[i*4 + 1] = linearToSRGBByte(mixed[1])
    data[i*4 + 2] = linearToSRGBByte(mixed[2])
    data[i*4 + 3] = 255
  }

  const texture = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat, THREE.UnsignedByteType)
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

/**
 * Helper: genera una palette MacrinoWeb dai 4 colori del brand
 * con stops equidistanti.
 */
export function createMacrinoWebPalette(width: number = 256): THREE.DataTexture {
  return createPaletteTexture([
    { color: '#3da9fc', position: 0.0 },   // accent (cyan brillante)
    { color: '#2273D4', position: 0.33 },  // primary (blu MW)
    { color: '#1A5BB8', position: 0.66 },  // primaryHover (blu profondo)
    { color: '#094067', position: 1.0 },   // text (navy quasi nero)
  ], width)
}
