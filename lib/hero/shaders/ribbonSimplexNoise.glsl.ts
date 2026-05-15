/**
 * Blocco GLSL 2D simplex condiviso tra vertex e fragment.
 * Prefisso `ribbon*` sui simboli per evitare collisioni con altri chunk.
 */
export const ribbonSimplexNoiseGlsl = /* glsl */ `
float ribbonHash11(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
vec2 ribbonHash22(vec2 x) {
  float k = 6.283185307 * ribbonHash11(x);
  return vec2(cos(k), sin(k));
}
float ribbonSimplexNoise(in vec2 p) {
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
    dot(a, ribbonHash22(i + 0.0)),
    dot(b, ribbonHash22(i + o)),
    dot(c, ribbonHash22(i + 1.0))
  );
  return dot(n, vec3(32.99));
}
`.trim()
