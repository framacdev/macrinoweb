'use client'

/**
 * HeroCanvas — Port del ribbon Stripe con geometria portrait e UV corrette
 *
 * GEOMETRIA: PlaneGeometry(1, 6, 40, 200) — portrait (1 largo, 6 alto)
 *   uv.x = 0→1 lungo la larghezza (1 unità = cross-section del nastro)
 *   uv.y = 0→1 lungo l'altezza  (6 unità = LUNGHEZZA del nastro)
 *
 * Perché portrait e non landscape (6×1):
 *   In Stripe, dFdy(v_uv.y) cattura l'effetto "edge-on" (cresta della piega)
 *   solo se uv.y = lunghezza E il nastro è orientato in modo che la lunghezza
 *   abbia componente in screen-Y. Con portrait + rotZ diagonale, funziona.
 *
 * TEXTURE: palette letta come vec2(uv.x, uv.y):
 *   - uv.x (cross-section) → larghezza palette: le linee bianche centrali
 *     di ribbon1.png coincidono con uv.x ≈ 0.5 = bordo del nastro in camera
 *   - uv.y (lunghezza) → altezza palette: gradiente lungo la lunghezza
 *
 * DISPLACEMENT:
 *   - Longitudinale (pieghe che corrono nella direzione della larghezza):
 *     pos.y += noise(pos.x, pos.z) — folds lungo la lunghezza come Stripe
 *   - Perpendicolare (pieghe che corrono nella direzione della lunghezza):
 *     pos.x += noise(pos.y, pos.z) — aggiuntivo rispetto a Stripe
 *
 * POST-PROCESSING: solo RadialBlurPass custom centrato sul ribbon.
 *   Niente Bloom, niente ChromaticAberration. Stripe non li usa.
 */

import { useEffect, useRef } from 'react'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass }    from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass }    from 'three/examples/jsm/postprocessing/ShaderPass.js'

// ─────────────────────────────────────────────────────────────────────────────
// VERTEX SHADER
// ─────────────────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  uniform float u_time;
  uniform float u_speed;
  uniform vec2  u_resolution;

  // Twist a 3 assi (porta Stripe)
  uniform float u_twistFrequencyX;
  uniform float u_twistFrequencyY;
  uniform float u_twistFrequencyZ;
  uniform float u_twistPowerX;
  uniform float u_twistPowerY;
  uniform float u_twistPowerZ;

  // Displacement longitudinale (pos.y, pieghe lungo la larghezza del nastro)
  uniform float u_displaceFrequencyX;
  uniform float u_displaceFrequencyZ;
  uniform float u_displaceAmount;

  // Displacement perpendicolare (pos.x, pieghe lungo la lunghezza del nastro)
  uniform float u_displaceFrequencyY;
  uniform float u_displaceFrequencyZ2;
  uniform float u_displaceAmountPerp;

  // Displacement in profondità (pos.z, respiro avanti/indietro verso camera)
  // Crea le condizioni di "edge-on" che rendono visibili le creste delle pieghe.
  uniform float u_displaceAmountZ;
  uniform float u_displaceFrequencyZD;

  varying vec2  v_uv;
  varying vec3  v_position;
  varying vec2  v_resolution;

  // ── Simplex noise GLSL 1.0 ────────────────────────────────────────────
  float hash11(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  vec2 hash2(vec2 x) {
    float k = 6.283185307 * hash11(x);
    return vec2(cos(k), sin(k));
  }
  float simplexNoise(in vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
    vec3 n = h*h*h * vec3(
      dot(a, hash2(i + 0.0)),
      dot(b, hash2(i + o)),
      dot(c, hash2(i + 1.0))
    );
    return dot(n, vec3(32.99));
  }

  // ── expStep (Quilez) ──────────────────────────────────────────────────
  // Falloff rapido vicino a 0, converge a 0 per x grande.
  // Concentra il twist verso un capo del nastro (uv ≈ 0).
  float expStep(float x, float n) {
    return exp2(-exp2(n) * pow(x, n));
  }

  // ── rotationMatrix (Rodrigues) ─────────────────────────────────────────
  mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s  = sin(angle);
    float c  = cos(angle);
    float oc = 1.0 - c;
    return mat4(
      oc*axis.x*axis.x + c,          oc*axis.x*axis.y - axis.z*s,  oc*axis.z*axis.x + axis.y*s,  0.0,
      oc*axis.x*axis.y + axis.z*s,   oc*axis.y*axis.y + c,          oc*axis.y*axis.z - axis.x*s,  0.0,
      oc*axis.z*axis.x - axis.y*s,   oc*axis.y*axis.z + axis.x*s,  oc*axis.z*axis.z + c,          0.0,
      0.0,                            0.0,                            0.0,                            1.0
    );
  }

  void main() {
    v_uv         = uv;      // uv.x = cross-section, uv.y = lunghezza
    v_resolution = u_resolution;

    vec3 pos = position.xyz;
    float t  = u_time * u_speed;

    // ── 1. DISPLACEMENT LONGITUDINALE (pos.y) ─────────────────────────
    // Il noise varia con pos.x (cross-section) e pos.z (profondità).
    // Parti della stessa "colonna" del nastro si alzano/abbassano in modo
    // diverso → pieghe che corrono nella direzione della LARGHEZZA.
    // Con geometria portrait (uv.y = lunghezza), il displacement in pos.y
    // crea increspature visibili frontalmente come "righe orizzontali".
    float nL = simplexNoise(vec2(pos.x * u_displaceFrequencyX + t,
                                 pos.z * u_displaceFrequencyZ + t));
    pos.y += u_displaceAmount * nL;

    // ── 2. DISPLACEMENT PERPENDICOLARE (pos.x) ─────────────────────────
    // Il noise varia con pos.y (lunghezza) e pos.z.
    // Parti della stessa "riga" del nastro si spostano in x →
    // pieghe visibili come "righe verticali" = lungo la lunghezza.
    // Questo è l'asse che mancava in Stripe: aggiungiamo displacement
    // anche nella direzione della cross-section.
    float nP = simplexNoise(vec2(pos.y * u_displaceFrequencyY + t * 0.7,
                                 pos.z * u_displaceFrequencyZ2 + t * 0.5));
    pos.x += u_displaceAmountPerp * nP;

    // ── 3. DISPLACEMENT IN PROFONDITÀ (pos.z) ─────────────────────────
    // Sposta il nastro avanti/indietro rispetto alla camera.
    // Questo è il "respiro" che crea le condizioni di edge-on:
    // quando il nastro si gonfia verso la camera in un punto e si ritrae
    // in un altro, il bordo tra le due zone è visto di taglio dal osservatore
    // → esattamente dove si vuole vedere le linee di luce.
    //
    // PIEGHE LONGITUDINALI (creste parallele alla lunghezza del ribbon):
    // La direzione di una piega è perpendicolare all'asse lungo cui il noise
    // varia più rapidamente. Voglio creste che corrano lungo Y (lunghezza),
    // quindi il noise deve variare velocemente lungo X (cross-section) e
    // lentamente lungo Y. Il rapporto 1.0 : 0.08 "stira" il noise in Y →
    // ogni "colonna" del ribbon mantiene una profondità coerente per tutta
    // la sua lunghezza → la cresta della piega corre dall'alto in basso.
    // Usiamo seed sfasati (+31.7 / +17.3) per evitare correlazione col noise
    // già applicato nei displacement X e Y degli step 1 e 2.
    float nZ = simplexNoise(vec2(pos.x * u_displaceFrequencyZD         + t * 0.6 + 31.7,
                                 pos.y * u_displaceFrequencyZD * 0.08  + t * 0.1 + 17.3));
    pos.z += u_displaceAmountZ * nZ;

    // ── 4. ROTAZIONI CONCATENATE STRIPE (twist a 3 assi) ──────────────
    // Ordine vec*mat identico a Stripe (= transpose(mat)*vec).
    mat4 rA = rotationMatrix(vec3(0.5, 0.0, 0.5), u_twistFrequencyY * expStep(v_uv.x, u_twistPowerY));
    mat4 rB = rotationMatrix(vec3(0.0, 0.5, 0.5), u_twistFrequencyX * expStep(v_uv.y, u_twistPowerX));
    mat4 rC = rotationMatrix(vec3(0.5, 0.0, 0.5), u_twistFrequencyZ * expStep(v_uv.y, u_twistPowerZ));

    v_position = pos;
    v_position = (vec4(v_position, 1.0) * rA).xyz;
    v_position = (vec4(v_position, 1.0) * rB).xyz;
    v_position = (vec4(v_position, 1.0) * rC).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(v_position, 1.0);
  }
`

// ─────────────────────────────────────────────────────────────────────────────
// FRAGMENT SHADER
// ─────────────────────────────────────────────────────────────────────────────

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D u_paletteTexture;

  uniform float u_colorSaturation;
  uniform float u_colorContrast;
  uniform float u_colorHueShift;

  uniform float u_glowAmount;
  uniform float u_glowPower;
  uniform float u_glowRamp;
  uniform float u_glowBrightness;

  uniform float u_noiseStrength;
  uniform float u_noiseFrequency;
  uniform float u_noiseColorAtten;
  uniform float u_parabolaPower;

  // ── Linee di luce procedurali ──────────────────────────────────────────
  // N strisce animate sulla superficie del nastro, indipendenti dalla geometria.
  // Posizione, oscillazione, blur, opacità e velocità sono tutti controllabili.
  // u_time deve essere dichiarato anche qui nel fragment shader.
  // Gli uniform NON si propagano automaticamente dal vertex shader:
  // ogni shader stage è un programma GLSL separato e deve dichiarare
  // esplicitamente tutti gli uniform che intende usare.
  // Senza questa riga, il compilatore GLSL non sa cos'è "u_time" quando
  // lo incontra nelle light lines → VALIDATE_STATUS false → schermo nero.
  uniform float u_time;

  uniform float u_lineCount;    // numero di linee (0–8)
  uniform float u_lineWidth;    // larghezza/blur di ogni linea (0=filo, 1=larga)
  uniform float u_lineOpacity;  // luminosità delle linee
  uniform float u_lineSpeedX;   // velocità oscillazione laterale (cross-section)
  uniform float u_lineAmpX;     // ampiezza oscillazione laterale
  uniform float u_lineSpeedY;   // velocità del ondeggiamento lungo la lunghezza
  uniform float u_lineFreqY;    // frequenza del ondeggiamento lungo la lunghezza

  varying vec2 v_uv;
  varying vec3 v_position;
  varying vec2 v_resolution;

  // ── Noise ─────────────────────────────────────────────────────────────
  float hash11(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  vec2 hash2(vec2 x) {
    float k = 6.283185307 * hash11(x);
    return vec2(cos(k), sin(k));
  }
  float simplexNoise(in vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
    vec3 n = h*h*h * vec3(dot(a,hash2(i+0.0)), dot(b,hash2(i+o)), dot(c,hash2(i+1.0)));
    return dot(n, vec3(32.99));
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  float mapLinear(float v, float a1, float a2, float b1, float b2) {
    return b1 + (v - a1) * (b2 - b1) / (a2 - a1);
  }
  float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
  }
  vec3 contrastFn(vec3 v, float a) { return (v - 0.5) * a + 0.5; }
  vec3 desaturate(vec3 color, float f) {
    vec3 gray = vec3(dot(vec3(0.299, 0.587, 0.114), color));
    return mix(color, gray, f);
  }
  vec3 hueShift(vec3 color, float shift) {
    vec3 g = vec3(0.57735);
    vec3 proj = g * dot(g, color);
    vec3 U = color - proj;
    vec3 V = cross(g, U);
    return U * cos(shift) + V * sin(shift) + proj;
  }

  // ── surfaceColor ───────────────────────────────────────────────────────
  // uv.x = cross-section, uv.y = lunghezza
  // palette lookup: vec2(uv.x, uv.y) → texture X = cross-section, Y = lunghezza
  // Le linee bianche al centro di ribbon1.png (texture.x ≈ 0.5)
  // coincidono con il bordo del nastro (uv.x ≈ 0.5 = centro della cross-section
  // che appare come bordo quando il nastro è visto di taglio da camera).
  vec3 surfaceColor(vec2 uv, vec3 pos, float pdy) {
    // Palette: uv.x → larghezza palette (cross-section), uv.y → altezza palette (lunghezza)
    vec3 color = texture2D(u_paletteTexture, vec2(uv.x, uv.y)).rgb;

    // Parabola: quasi 0 al centro di uv.y (lunghezza), sale ai capi.
    // Modula il noise: più forte ai capi del nastro, quasi zero al centro.
    float p = 1.0 - parabola(uv.y, u_parabolaPower);

    // 2 ottave simplex noise. NOTA: in Stripe v_uv.x = cross-section, v_uv.y = lunghezza.
    // n0 varia lentamente lungo la lunghezza (0.1 freq su uv.y) e la cross-section.
    // n1 usa n0 come modulatore di frequenza → texture organica multi-scala.
    float n0 = simplexNoise(vec2(v_uv.x * 0.5, v_uv.y * 0.1));
    float n1 = simplexNoise(vec2(
      v_uv.x * (u_noiseFrequency + u_noiseFrequency * 0.5 * n0),
      v_uv.y * 4.0 * n0
    ));
    n1 = mapLinear(n1, -1.0, 1.0, 0.0, 1.0);

    // Aggiunta schiariva: più intensa dove pdy è alto (zone piatte/faccia)
    // e ai capi (p alto). Diminuisce dove il blue è alto (color.b alto).
    color += (n1 * u_noiseStrength * (1.0 - color.b * u_noiseColorAtten) * pdy * p);

    return color;
  }

  void main() {
    // ── pdy: derivata schermo-spaziale di v_uv.y (lunghezza del nastro) ─
    // Con geometria portrait (uv.y = lunghezza) e nastro diagonale:
    // - Face-on (zona piatta): uv.y cambia di molto per pixel in screen-Y
    //   → dFdy grande → pdy grande → poco glow
    // - Edge-on (cresta): molti pixel sullo stesso punto della lunghezza
    //   → dFdy piccolo → pdy piccolo → GLOW sulle creste ✓
    vec2  dy  = dFdy(v_uv);
    float pdy = dy.y * v_resolution.y * u_glowAmount;
    pdy = mapLinear(pdy, -1.0, 1.0, 0.0, 1.0);
    pdy = clamp(pdy, 0.0, 1.0);
    pdy = pow(pdy, u_glowPower);
    pdy = smoothstep(0.0, u_glowRamp, pdy);
    pdy = clamp(pdy, 0.0, 1.0);

    vec4 color = vec4(surfaceColor(v_uv, v_position, pdy), 1.0);

    // Color grading (ordine Stripe)
    color.rgb = contrastFn(color.rgb, u_colorContrast);
    color.rgb = desaturate(color.rgb, 1.0 - u_colorSaturation);
    color.rgb = hueShift(color.rgb, u_colorHueShift);

    // ── Glow sottile dFdy sulle creste geometriche (brightening ambientale) ─
    color += (1.0 - pdy) * u_glowBrightness;

    // ── LINEE DI LUCE PROCEDURALI ────────────────────────────────────────
    // N strisce animate sulla superficie del nastro.
    // Ogni linea è posizionata a un x_base spaziato uniformemente sulla
    // cross-section del nastro (uv.x ∈ [0,1]), poi oscilla lateralmente
    // con una sinusoide animata e ondeggia lungo la lunghezza (uv.y).
    //
    // BORDI MORBIDI: smoothstep(width, 0.0, dist) → zero distanza = 1.0 (pieno),
    // crescendo con dist → cala a 0 entro "width". Niente aliasing hard-edge.
    //
    // GLSL 1.0: i loop devono avere limiti costanti noti al compile time.
    // Uso il trucco "if (i >= nLines) break" con limite fisso a 8.
    float lineGlow = 0.0;
    int nLines = int(clamp(u_lineCount, 0.0, 8.0));
    for (int i = 0; i < 8; i++) {
      if (i >= nLines) break;
      float fi    = float(i);
      // Spaziatura uniforme: linea i centrata a (i + 0.5) / count
      float baseX = (fi + 0.5) / u_lineCount;
      // Phase offset diverso per ogni linea → movimento indipendente
      // 2.399 ≈ golden angle (rad): distribuisce le fasi in modo ottimale
      float phase = fi * 2.399;
      // Oscillazione laterale: si muove avanti-indietro sulla cross-section
      float offsetX = sin(u_time * u_lineSpeedX + phase) * u_lineAmpX;
      // Ondeggiamento lungo la lunghezza: la linea si "curva" mentre scorre
      // La frequenza uFreqY controlla quante "onde" ci sono lungo la lunghezza.
      float waveX   = sin(v_uv.y * u_lineFreqY + u_time * u_lineSpeedY + phase * 0.7)
                    * u_lineAmpX * 0.4;
      float lineX   = baseX + offsetX + waveX;
      // Distanza del pixel corrente dal centro della linea
      float dist    = abs(v_uv.x - lineX);
      // smoothstep: pieno dove dist < 0, cala a 0 dove dist = uLineWidth
      float line    = smoothstep(u_lineWidth, 0.0, dist);
      lineGlow     += line;
    }
    lineGlow = clamp(lineGlow, 0.0, 1.0) * u_lineOpacity;
    // Aggiunta additiva: le linee sono sovrapposte al colore della palette.
    // vec3(1.0) = bianco puro → le linee schiariscono verso bianco.
    // Il clamp finale garantisce che non si esca dall'intervallo [0,1].
    color.rgb += vec3(lineGlow);

    gl_FragColor = clamp(color, 0.0, 1.0);
  }
`

// ─────────────────────────────────────────────────────────────────────────────
// RADIAL BLUR PASS — blur concentrico centrato sul ribbon
//
// Non è un DoF depth-based: è un 2D focus effect.
// Il centro del ribbon in screen space viene passato come uniform e aggiornato
// ogni frame proiettando la posizione world del ribbon con la camera.
// Zona centrale del nastro = nitida, bordi del viewport sfumano.
// ─────────────────────────────────────────────────────────────────────────────

const RadialBlurShader = {
  uniforms: {
    tDiffuse:    { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uCenter:     { value: new THREE.Vector2(0.5, 0.5) }, // UV [0,1] del centro ribbon
    uBlurStr:    { value: 6.0 },   // max pixel di blur ai bordi
    uBlurRadius: { value: 0.30 },  // distanza dal centro oltre cui inizia il blur
    uBlurSoft:   { value: 0.40 },  // softness della transizione
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2  uResolution;
    uniform vec2  uCenter;
    uniform float uBlurStr;
    uniform float uBlurRadius;
    uniform float uBlurSoft;
    varying vec2 vUv;

    void main() {
      // Distanza aspect-corrected dal centro del ribbon
      vec2 c = vUv - uCenter;
      c.x *= uResolution.x / uResolution.y;
      float dist = length(c);

      // Maschera: 0 al centro, sale con la distanza
      float blurMask = smoothstep(uBlurRadius, uBlurRadius + uBlurSoft, dist);
      float radius   = blurMask * uBlurStr;

      // 9-tap box blur scalato per distanza.
      // Tap più grandi = pixel lontani dal nastro più sfocati.
      vec2 texel = 1.0 / uResolution;
      vec4 sum = vec4(0.0);
      sum += texture2D(tDiffuse, vUv + texel * vec2(-1.0, -1.0) * radius);
      sum += texture2D(tDiffuse, vUv + texel * vec2( 0.0, -1.0) * radius);
      sum += texture2D(tDiffuse, vUv + texel * vec2( 1.0, -1.0) * radius);
      sum += texture2D(tDiffuse, vUv + texel * vec2(-1.0,  0.0) * radius);
      sum += texture2D(tDiffuse, vUv);
      sum += texture2D(tDiffuse, vUv + texel * vec2( 1.0,  0.0) * radius);
      sum += texture2D(tDiffuse, vUv + texel * vec2(-1.0,  1.0) * radius);
      sum += texture2D(tDiffuse, vUv + texel * vec2( 0.0,  1.0) * radius);
      sum += texture2D(tDiffuse, vUv + texel * vec2( 1.0,  1.0) * radius);
      sum /= 9.0;

      vec4 original = texture2D(tDiffuse, vUv);
      gl_FragColor = mix(original, sum, blurMask);
    }
  `,
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  const controls = useControls({
    'Twist (3 assi)': folder({
      twistFrequencyX: { label: 'Frequency X', value: 0.7,  min: -3,  max: 3,   step: 0.01 },
      twistFrequencyY: { label: 'Frequency Y', value: 1.5,  min: -3,  max: 3,   step: 0.01 },
      twistFrequencyZ: { label: 'Frequency Z', value: 0.5,  min: -3,  max: 3,   step: 0.01 },
      twistPowerX:     { label: 'Power X',     value: 2.0,  min: 0.1, max: 8,   step: 0.05 },
      twistPowerY:     { label: 'Power Y',     value: 2.0,  min: 0.1, max: 8,   step: 0.05 },
      twistPowerZ:     { label: 'Power Z',     value: 2.0,  min: 0.1, max: 8,   step: 0.05 },
    }),
    'Pieghe Longitudinali (larghezza)': folder({
      // pos.y += noise(pos.x, pos.z) → increspature che corrono nella direzione
      // della LARGHEZZA del nastro. Viste frontalmente: righe orizzontali.
      displaceFrequencyX: { label: 'Freq X (cross-section)', value: 0.5, min: 0, max: 8,  step: 0.01 },
      displaceFrequencyZ: { label: 'Freq Z (profondità)',     value: 0.5, min: 0, max: 8,  step: 0.01 },
      displaceAmount:     { label: 'Intensità',               value: 0.3, min: 0, max: 3,  step: 0.005 },
    }),
    'Pieghe Perpendicolari (lunghezza)': folder({
      // pos.x += noise(pos.y, pos.z) → increspature che corrono nella direzione
      // della LUNGHEZZA del nastro. Viste frontalmente: righe verticali.
      displaceFrequencyY:  { label: 'Freq Y (lunghezza)',  value: 0.5, min: 0, max: 8,  step: 0.01 },
      displaceFrequencyZ2: { label: 'Freq Z2 (profondità)', value: 0.5, min: 0, max: 8,  step: 0.01 },
      displaceAmountPerp:  { label: 'Intensità',            value: 0.0, min: 0, max: 3,  step: 0.005 },
    }),
    'Pieghe in Profondità (Z)': folder({
      // Displacement sull'asse Z: il nastro si gonfia verso/lontano dalla camera.
      // È il "respiro" che crea le creste viste di taglio → condizioni ideali
      // per le linee di luce. Aumenta questo per creste più marcate.
      displaceAmountZ:   { label: 'Intensità',  value: 0.4,  min: 0,   max: 3,   step: 0.01 },
      displaceFrequencyZD:{ label: 'Frequenza', value: 0.6,  min: 0.1, max: 5,   step: 0.01 },
    }),
    'Linee di Luce': folder({
      // Linee procedurali: N strisce animate sulla superficie del nastro.
      // Indipendenti dalla geometria → controllo totale.
      lineCount:   { label: 'Quantità',              value: 3,    min: 0,    max: 8,    step: 1     },
      lineWidth:   { label: 'Larghezza / Blur',      value: 0.015,min: 0.001,max: 0.15, step: 0.001 },
      lineOpacity: { label: 'Opacità / Luminosità',  value: 0.8,  min: 0,    max: 3.0,  step: 0.01  },
      lineSpeedX:  { label: 'Velocità laterale',     value: 0.3,  min: 0,    max: 3.0,  step: 0.01  },
      lineAmpX:    { label: 'Ampiezza laterale',     value: 0.08, min: 0,    max: 0.5,  step: 0.005 },
      lineSpeedY:  { label: 'Velocità ondeggiamento',value: 0.4,  min: 0,    max: 3.0,  step: 0.01  },
      lineFreqY:   { label: 'Frequenza ondeggiamento',value: 4.0,  min: 0,    max: 20.0, step: 0.1   },
    }),
    'Velocità Globale': folder({
      speed: { label: 'Speed (animazione)', value: 0.2, min: 0, max: 3, step: 0.01 },
    }),
    'Glow (Linee creste)': folder({
      glowAmount:     { label: 'Amount',      value: 50,   min: 0,    max: 200,  step: 0.5  },
      glowPower:      { label: 'Power',       value: 1.5,  min: 0.1,  max: 6,    step: 0.05 },
      glowRamp:       { label: 'Ramp',        value: 0.6,  min: 0.01, max: 2,    step: 0.01 },
      // Stripe usa 0.25 fisso. Se la tua palette è più scura o satura, aumentalo.
      // Valori > 1.0 portano sicuramente sopra clamp → bianco puro sulle creste.
      glowBrightness: { label: 'Brightness (creste)', value: 0.5, min: 0, max: 3.0, step: 0.01 },
    }),
    'Surface Noise': folder({
      noiseStrength:   { label: 'Strength',          value: 0.2,  min: 0,   max: 2,    step: 0.005 },
      noiseFrequency:  { label: 'Frequency',         value: 600,  min: 50,  max: 2000, step: 5     },
      noiseColorAtten: { label: 'Color Attenuation', value: 0.9,  min: 0,   max: 1,    step: 0.01  },
      parabolaPower:   { label: 'Parabola Power',    value: 3.0,  min: 0.5, max: 8,    step: 0.05  },
    }),
    'Color Grading': folder({
      colorSaturation: { label: 'Saturation', value: 1.0, min: 0,        max: 2,       step: 0.01 },
      colorContrast:   { label: 'Contrast',   value: 1.0, min: 0,        max: 2,       step: 0.01 },
      colorHueShift:   { label: 'Hue Shift',  value: 0.0, min: -3.14159, max: 3.14159, step: 0.01 },
    }),
    'Blur Radiale (attorno al nastro)': folder({
      // Focus centrato sul nastro. Più lontano dal nastro = più sfocato.
      blurStr:    { label: 'Intensità',  value: 6.0,  min: 0,    max: 30,  step: 0.1 },
      blurRadius: { label: 'Raggio focus', value: 0.30, min: 0,  max: 1.0, step: 0.01 },
      blurSoft:   { label: 'Softness',   value: 0.40, min: 0.01, max: 1.0, step: 0.01 },
    }),
    'Camera & Posizione': folder({
      camFov: { label: 'FOV',           value: 35,   min: 20,       max: 120,      step: 1    },
      camZ:   { label: 'Camera Z',      value: 4,    min: 1,        max: 20,       step: 0.05 },
      rotX:   { label: 'Rotazione X',   value: 0.0,  min: -Math.PI, max: Math.PI,  step: 0.01 },
      rotY:   { label: 'Rotazione Y',   value: 0.0,  min: -Math.PI, max: Math.PI,  step: 0.01 },
      rotZ:   { label: 'Rotazione Z',   value: -0.5, min: -Math.PI, max: Math.PI,  step: 0.01 },
      posX:   { label: 'Posizione X',   value: 0.0,  min: -5,       max: 5,        step: 0.05 },
      posY:   { label: 'Posizione Y',   value: 0.0,  min: -5,       max: 5,        step: 0.05 },
      scale:  { label: 'Scala',         value: 1.5,  min: 0.1,      max: 5,        step: 0.05 },
    }),
  })

  const ctrlRef = useRef(controls)
  useEffect(() => { ctrlRef.current = controls }, [controls])

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current

    // ── Scene ────────────────────────────────────────────────────────────
    // Nessun scene.background: il colore di sfondo è gestito dalla div CSS.
    const scene = new THREE.Scene()

    // ── Camera ───────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      ctrlRef.current.camFov,
      mount.clientWidth / mount.clientHeight,
      0.1, 100
    )
    camera.position.z = ctrlRef.current.camZ

    // ── Renderer ─────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    // Transparent clear: lo sfondo è gestito interamente dal CSS della div.
    // Con alpha:true + clearColor(0,0,0,0), il canvas Three.js è trasparente
    // dove non c'è geometria → il backgroundColor della div (var(--color-bg))
    // si vede attraverso, aggiornandosi automaticamente con il dark mode.
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // ── Geometria: PlaneGeometry PORTRAIT ─────────────────────────────────
    // width=1 (cross-section), height=6 (lunghezza)
    // uv.x = 0→1 lungo 1 unità = cross-section
    // uv.y = 0→1 lungo 6 unità = lunghezza
    // Il piano è nell'XY plane (Z=0), niente rotation.x.
    // Lo spessore visivo del nastro emerge dal twist.
    const geometry = new THREE.PlaneGeometry(1, 6, 40, 200)

    // ── Texture ───────────────────────────────────────────────────────────
    // Palette 1:1 come Stripe. ClampToEdge: niente tiling.
    const texture = new THREE.TextureLoader().load(
      '/textures/ribbon1.png',
      undefined, undefined,
      () => console.warn('HeroCanvas: texture non trovata in /public/textures/ribbon1.png')
    )
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.colorSpace = THREE.SRGBColorSpace

    // ── Uniforms ─────────────────────────────────────────────────────────
    const c0 = ctrlRef.current
    const uniforms: Record<string, THREE.IUniform> = {
      u_time:       { value: 0 },
      u_speed:      { value: c0.speed },
      u_resolution: { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
      u_paletteTexture: { value: texture },

      u_twistFrequencyX: { value: c0.twistFrequencyX },
      u_twistFrequencyY: { value: c0.twistFrequencyY },
      u_twistFrequencyZ: { value: c0.twistFrequencyZ },
      u_twistPowerX:     { value: c0.twistPowerX },
      u_twistPowerY:     { value: c0.twistPowerY },
      u_twistPowerZ:     { value: c0.twistPowerZ },

      u_displaceFrequencyX:  { value: c0.displaceFrequencyX },
      u_displaceFrequencyZ:  { value: c0.displaceFrequencyZ },
      u_displaceAmount:      { value: c0.displaceAmount },

      u_displaceFrequencyY:  { value: c0.displaceFrequencyY },
      u_displaceFrequencyZ2: { value: c0.displaceFrequencyZ2 },
      u_displaceAmountPerp:  { value: c0.displaceAmountPerp },

      u_displaceAmountZ:    { value: c0.displaceAmountZ },
      u_displaceFrequencyZD:{ value: c0.displaceFrequencyZD },

      u_colorSaturation: { value: c0.colorSaturation },
      u_colorContrast:   { value: c0.colorContrast },
      u_colorHueShift:   { value: c0.colorHueShift },

      u_glowAmount:      { value: c0.glowAmount },
      u_glowPower:       { value: c0.glowPower },
      u_glowRamp:        { value: c0.glowRamp },
      u_glowBrightness:  { value: c0.glowBrightness },

      u_lineCount:   { value: c0.lineCount },
      u_lineWidth:   { value: c0.lineWidth },
      u_lineOpacity: { value: c0.lineOpacity },
      u_lineSpeedX:  { value: c0.lineSpeedX },
      u_lineAmpX:    { value: c0.lineAmpX },
      u_lineSpeedY:  { value: c0.lineSpeedY },
      u_lineFreqY:   { value: c0.lineFreqY },

      u_noiseStrength:   { value: c0.noiseStrength },
      u_noiseFrequency:  { value: c0.noiseFrequency },
      u_noiseColorAtten: { value: c0.noiseColorAtten },
      u_parabolaPower:   { value: c0.parabolaPower },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: false,
    })

    const ribbon = new THREE.Mesh(geometry, material)
    ribbon.rotation.z = c0.rotZ
    ribbon.position.set(c0.posX, c0.posY, 0)
    ribbon.scale.setScalar(c0.scale)
    scene.add(ribbon)

    // ── EffectComposer + RadialBlurPass ──────────────────────────────────
    // FIX BORDI SEGHETTATI SUL NASTRO:
    // WebGLRenderer con antialias:true applica MSAA solo sul canvas finale,
    // NON sui render target intermedi del composer. Fornendo un render target
    // esplicito con samples:4 abilita MSAA anche per il pipeline del composer.
    // Risultato: bordo del nastro (PlaneGeometry) smooth invece di dentellato.
    const msaaTarget = new THREE.WebGLRenderTarget(
      mount.clientWidth  * Math.min(window.devicePixelRatio, 2),
      mount.clientHeight * Math.min(window.devicePixelRatio, 2),
      { samples: 4 }
    )
    const composer = new EffectComposer(renderer, msaaTarget)
    composer.addPass(new RenderPass(scene, camera))

    const blurPass = new ShaderPass(RadialBlurShader)
    ;(blurPass.uniforms['uResolution'].value as THREE.Vector2).set(mount.clientWidth, mount.clientHeight)
    composer.addPass(blurPass)

    // Vector per proiezione del centro ribbon in screen space
    const ribbonCenter = new THREE.Vector3(0, 0, 0)
    const centerNdc    = new THREE.Vector3()
    const centerUv     = new THREE.Vector2()

    // ── Animation loop ────────────────────────────────────────────────────
    const clock = new THREE.Clock()
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      const c = ctrlRef.current

      // Aggiorno uniforms material
      uniforms.u_time.value  = t
      uniforms.u_speed.value = c.speed

      uniforms.u_twistFrequencyX.value = c.twistFrequencyX
      uniforms.u_twistFrequencyY.value = c.twistFrequencyY
      uniforms.u_twistFrequencyZ.value = c.twistFrequencyZ
      uniforms.u_twistPowerX.value     = c.twistPowerX
      uniforms.u_twistPowerY.value     = c.twistPowerY
      uniforms.u_twistPowerZ.value     = c.twistPowerZ

      uniforms.u_displaceFrequencyX.value  = c.displaceFrequencyX
      uniforms.u_displaceFrequencyZ.value  = c.displaceFrequencyZ
      uniforms.u_displaceAmount.value      = c.displaceAmount

      uniforms.u_displaceFrequencyY.value  = c.displaceFrequencyY
      uniforms.u_displaceFrequencyZ2.value = c.displaceFrequencyZ2
      uniforms.u_displaceAmountPerp.value  = c.displaceAmountPerp

      uniforms.u_displaceAmountZ.value     = c.displaceAmountZ
      uniforms.u_displaceFrequencyZD.value = c.displaceFrequencyZD

      uniforms.u_colorSaturation.value = c.colorSaturation
      uniforms.u_colorContrast.value   = c.colorContrast
      uniforms.u_colorHueShift.value   = c.colorHueShift

      uniforms.u_glowAmount.value     = c.glowAmount
      uniforms.u_glowPower.value      = c.glowPower
      uniforms.u_glowRamp.value       = c.glowRamp
      uniforms.u_glowBrightness.value = c.glowBrightness

      uniforms.u_lineCount.value   = c.lineCount
      uniforms.u_lineWidth.value   = c.lineWidth
      uniforms.u_lineOpacity.value = c.lineOpacity
      uniforms.u_lineSpeedX.value  = c.lineSpeedX
      uniforms.u_lineAmpX.value    = c.lineAmpX
      uniforms.u_lineSpeedY.value  = c.lineSpeedY
      uniforms.u_lineFreqY.value   = c.lineFreqY

      uniforms.u_noiseStrength.value   = c.noiseStrength
      uniforms.u_noiseFrequency.value  = c.noiseFrequency
      uniforms.u_noiseColorAtten.value = c.noiseColorAtten
      uniforms.u_parabolaPower.value   = c.parabolaPower

      // Trasformazioni ribbon
      ribbon.rotation.x = c.rotX
      ribbon.rotation.y = c.rotY
      ribbon.rotation.z = c.rotZ
      ribbon.position.set(c.posX, c.posY, 0)
      ribbon.scale.setScalar(c.scale)
      ribbon.updateMatrixWorld()

      // Proiezione centro ribbon → UV screen [0,1] per il blur
      centerNdc.copy(ribbonCenter).applyMatrix4(ribbon.matrixWorld)
      centerNdc.project(camera)
      centerUv.set((centerNdc.x + 1) / 2, (centerNdc.y + 1) / 2)
      blurPass.uniforms['uCenter'].value.copy(centerUv)
      blurPass.uniforms['uBlurStr'].value    = c.blurStr
      blurPass.uniforms['uBlurRadius'].value = c.blurRadius
      blurPass.uniforms['uBlurSoft'].value   = c.blurSoft

      // Camera
      if (camera.fov !== c.camFov || camera.position.z !== c.camZ) {
        camera.fov        = c.camFov
        camera.position.z = c.camZ
        camera.updateProjectionMatrix()
      }

      composer.render()
    }
    animate()

    // ── Resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)
      ;(uniforms.u_resolution.value as THREE.Vector2).set(w, h)
      ;(blurPass.uniforms['uResolution'].value as THREE.Vector2).set(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      texture.dispose()
      msaaTarget.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        // Il colore di sfondo è gestito qui con CSS, non dentro Three.js.
        // La CSS variable si aggiorna automaticamente quando next-themes
        // switcha il tema (aggiunge/rimuove la classe .dark sull'<html>).
        // La transition sincrona con quella del sito (Header, body ecc).
        backgroundColor: 'var(--color-bg)',
        transition: 'background-color 0.3s ease',
      }}
    />
  )
}