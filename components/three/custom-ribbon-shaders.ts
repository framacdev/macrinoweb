/**
 * custom-ribbon-shaders.ts
 *
 * Shader VERTEX e FRAGMENT del ribbon di Stripe.com, estratti dal browser
 * via Needle Inspector e ripuliti.
 *
 * STRUTTURA del vertex shader:
 * 1. Riceve un piano denso (33153 vertici) come geometria base
 * 2. Calcola tre matrici di rotazione su assi indipendenti, usando expStep()
 *    (una "exponential step" function di Inigo Quilez) come modulator
 * 3. Applica simplex noise displacement sull'asse Y in funzione del tempo
 * 4. Compone le tre rotazioni: rotationA → rotationB → rotationC
 *
 * Risultato: il piano viene "torto" tre volte in modo non uniforme, creando
 * il caratteristico nastro 3D che si attorciglia.
 *
 * STRUTTURA del fragment shader:
 * 1. Sample iniziale dalla texture palette via uv.x (gradient di colori)
 * 2. Aggiunge texture noise (simplex) per simulare il "tessuto"
 * 3. Calcola pdy = derivata di uv.y in screen space → diventa il "glow"
 *    sui bordi del nastro (zone dove uv.y cambia rapidamente in pixel)
 * 4. Color grading: contrast, saturation, hue shift
 * 5. Final: clamp e output
 *
 * SOURCE: vertex shader e fragment shader nel file Stripe_aggiuntivi.txt
 * estratti via Needle Inspector dalla homepage Stripe.com (Apr 2026).
 */

export const customRibbonVertexShader = /* glsl */ `
  precision highp float;

  attribute vec3 tangent;

  uniform float u_time;
  uniform float u_speed;
  uniform vec2 u_resolution;
  uniform float u_twistFrequencyX;
  uniform float u_twistFrequencyY;
  uniform float u_twistFrequencyZ;
  uniform float u_twistPowerX;
  uniform float u_twistPowerY;
  uniform float u_twistPowerZ;
  uniform float u_displaceFrequencyX;
  uniform float u_displaceFrequencyZ;
  uniform float u_displaceAmount;

  varying float v_time;
  varying vec2 v_uv;
  varying vec3 v_position;
  varying vec4 v_clipPosition;
  varying vec2 v_resolution;

  // ── Hash & noise (Stefan Gustavson + xxhash) ─────────────────────────────
  float xxhash(vec2 x) {
    uvec2 t = floatBitsToUint(x);
    uint h = 0xc2b2ae3du * t.x + 0x165667b9u;
    h = (h << 17u | h >> 15u) * 0x27d4eb2fu;
    h += 0xc2b2ae3du * t.y;
    h = (h << 17u | h >> 15u) * 0x27d4eb2fu;
    h ^= h >> 15u;
    h *= 0x85ebca77u;
    h ^= h >> 13u;
    h *= 0xc2b2ae3du;
    h ^= h >> 16u;
    return uintBitsToFloat(h >> 9u | 0x3f800000u) - 1.0;
  }

  vec2 hash(vec2 x) {
    float k = 6.283185307 * xxhash(x);
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
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * vec3(
      dot(a, hash(i + 0.0)),
      dot(b, hash(i + o)),
      dot(c, hash(i + 1.0))
    );
    return dot(n, vec3(32.99));
  }

  // ── Shaping helpers (Inigo Quilez) ───────────────────────────────────────
  float expStep(float x, float n) {
    return exp2(-exp2(n) * pow(x, n));
  }

  float mapLinear(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }

  // ── Rotation matrix builder ──────────────────────────────────────────────
  mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(
      oc*axis.x*axis.x+c,        oc*axis.x*axis.y-axis.z*s, oc*axis.z*axis.x+axis.y*s, 0.0,
      oc*axis.x*axis.y+axis.z*s, oc*axis.y*axis.y+c,        oc*axis.y*axis.z-axis.x*s, 0.0,
      oc*axis.z*axis.x-axis.y*s, oc*axis.y*axis.z+axis.x*s, oc*axis.z*axis.z+c,        0.0,
      0.0, 0.0, 0.0, 1.0
    );
  }

  // ── Vertex displacement con simplex noise ────────────────────────────────
  vec3 displace(vec2 uv, vec3 position, float time, float frequencyX, float frequencyY, float amount) {
    float noise = simplexNoise(vec2(position.x * frequencyX + time, position.z * frequencyY + time));
    float dist = mapLinear(uv.x, 0.0, 1.0, -1.0, 1.0);
    position.y += amount * noise;
    return position;
  }

  void main(void) {
    v_time = u_time;
    v_uv = uv;
    v_resolution = u_resolution;

    // Tre rotazioni indipendenti, ognuna modulata da expStep() su un asse
    // diverso. expStep dà una falloff "esponenziale" che concentra la
    // rotazione in zone specifiche del piano (non uniforme).
    mat4 rotationA = rotationMatrix(vec3(0.5, 0.0, 0.5), u_twistFrequencyY * expStep(v_uv.x, u_twistPowerY));
    mat4 rotationB = rotationMatrix(vec3(0.0, 0.5, 0.5), u_twistFrequencyX * expStep(v_uv.y, u_twistPowerX));
    mat4 rotationC = rotationMatrix(vec3(0.5, 0.0, 0.5), u_twistFrequencyZ * expStep(v_uv.y, u_twistPowerZ));

    // Displacement con simplex noise (tempo-modulato)
    vec3 displacedPosition = displace(uv, position.xyz, u_time * u_speed, u_displaceFrequencyX, u_displaceFrequencyZ, u_displaceAmount);
    v_position = displacedPosition;

    // Composizione delle tre rotazioni in cascata
    v_position = (vec4(v_position, 1.0) * rotationA).xyz;
    v_position = (vec4(v_position, 1.0) * rotationB).xyz;
    v_position = (vec4(v_position, 1.0) * rotationC).xyz;

    v_clipPosition = projectionMatrix * modelViewMatrix * vec4(v_position, 1.0);
    gl_Position = v_clipPosition;
  }
`

export const customRibbonFragmentShader = /* glsl */ `
  precision highp float;

  varying float v_time;
  varying vec2 v_uv;
  varying vec3 v_position;
  varying vec4 v_clipPosition;
  varying vec2 v_resolution;

  uniform vec2 u_mousePosition;
  uniform sampler2D u_paletteTexture;
  uniform float u_colorSaturation;
  uniform float u_colorContrast;
  uniform float u_colorHueShift;
  uniform float u_glowAmount;
  uniform float u_glowPower;
  uniform float u_glowRamp;
  uniform vec3 u_clearColor;
  uniform float u_noiseStrength;
  uniform float u_noiseFreq;

  // ── Hash & noise (identico al vertex) ────────────────────────────────────
  float xxhash(vec2 x) {
    uvec2 t = floatBitsToUint(x);
    uint h = 0xc2b2ae3du * t.x + 0x165667b9u;
    h = (h << 17u | h >> 15u) * 0x27d4eb2fu;
    h += 0xc2b2ae3du * t.y;
    h = (h << 17u | h >> 15u) * 0x27d4eb2fu;
    h ^= h >> 15u;
    h *= 0x85ebca77u;
    h ^= h >> 13u;
    h *= 0xc2b2ae3du;
    h ^= h >> 16u;
    return uintBitsToFloat(h >> 9u | 0x3f800000u) - 1.0;
  }

  vec2 hash(vec2 x) {
    float k = 6.283185307 * xxhash(x);
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
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * vec3(
      dot(a, hash(i + 0.0)),
      dot(b, hash(i + o)),
      dot(c, hash(i + 1.0))
    );
    return dot(n, vec3(32.99));
  }

  // ── Color grading helpers ────────────────────────────────────────────────
  vec3 contrast(in vec3 v, in float a) {
    return (v - 0.5) * a + 0.5;
  }

  vec3 desaturate(vec3 color, float factor) {
    vec3 lum = vec3(0.299, 0.587, 0.114);
    vec3 gray = vec3(dot(lum, color));
    return mix(color, gray, factor);
  }

  vec3 hueShift(vec3 color, float shift) {
    vec3 gray = vec3(0.57735);
    vec3 projection = gray * dot(gray, color);
    vec3 U = color - projection;
    vec3 V = cross(gray, U);
    vec3 shifted = U * cos(shift) + V * sin(shift) + projection;
    return shifted;
  }

  float mapLinear(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }

  float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
  }

  // ── Surface color con noise "tessuto" ────────────────────────────────────
  vec3 surfaceColor(vec2 uv, vec3 pos, float pdy) {
    // Sample del gradient base dalla palette texture
    vec3 color = texture2D(u_paletteTexture, vec2(uv.x, uv.y)).rgb;

    float strength = u_noiseStrength;
    float freq = u_noiseFreq;
    float colorAtten = 0.9;
    float paraPow = 3.0;

    // Parabola che enfatizza il centro del nastro
    float p = 1.0 - parabola(uv.x, paraPow);

    // Due ottave di simplex noise: la prima distorce la seconda
    float n0 = simplexNoise(vec2(v_uv.x * 0.1, v_uv.y * 0.5));
    float n1 = simplexNoise(vec2(v_uv.x * (freq + (freq * 0.5 * n0)), v_uv.y * 4.0 * n0));
    n1 = mapLinear(n1, -1.0, 1.0, 0.0, 1.0);

    vec3 textureColor = color;
    textureColor += (n1 * strength * (1.0 - textureColor.b * colorAtten) * pdy * p);
    color = textureColor;

    return color;
  }

  void main(void) {
    vec2 st = gl_FragCoord.xy / v_resolution.xy;

    // Calcolo del "glow factor" pdy:
    // dFdy(v_uv) = quanto cambia v_uv tra pixel adiacenti in screen space.
    // Sui bordi del nastro (dove la geometria si curva fortemente), questo
    // valore è grande → glow intenso. Al centro (geometria piatta) → glow basso.
    // È il segreto del "luminescente sui bordi" di Stripe.
    vec2 dy = dFdy(v_uv);
    float pdy = dy.y * v_resolution.y * u_glowAmount;
    pdy = mapLinear(pdy, -1.0, 1.0, 0.0, 1.0);
    pdy = clamp(pdy, 0.0, 1.0);
    pdy = pow(pdy, u_glowPower);
    pdy = smoothstep(0.0, u_glowRamp, pdy);
    pdy = clamp(pdy, 0.0, 1.0);

    // Surface color con noise "tessuto"
    vec4 color = vec4(surfaceColor(v_uv, v_position, pdy), 1.0);

    // Color grading
    color.rgb = contrast(color.rgb, u_colorContrast);
    color.rgb = desaturate(color.rgb, 1.0 - u_colorSaturation);
    color.rgb = hueShift(color.rgb, u_colorHueShift);

    // Lift sulle zone con poco glow per evitare ombre piatte
    color += (1.0 - pdy) * 0.25;

    gl_FragColor = clamp(color, 0.0, 1.0);
  }
`