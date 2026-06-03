import * as THREE from 'three'

/** Pass post-processing vignetta blur (bordi sx + bottom). */
export const heroRibbonRadialBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uBlurStr: { value: 6.0 },
    uVignetteLeft: { value: 0.1 },
    uVignetteBottom: { value: 0.35 },
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
    uniform float uBlurStr;
    uniform float uVignetteLeft;
    uniform float uVignetteBottom;
    varying vec2 vUv;

    void main() {
      float maskLeft   = 1.0 - smoothstep(0.0, uVignetteLeft,   vUv.x);
      float maskBottom = 1.0 - smoothstep(0.0, uVignetteBottom, vUv.y);
      float blurMask = maskLeft + maskBottom - maskLeft * maskBottom;

      // WHY: la maschera è ~0 sulla maggior parte dello schermo (solo i bordi
      // sinistro e bottom sono sfocati). Lì il blur a 9 tap farebbe 9 fetch
      // identiche poi scartate dal mix finale: early-out a una sola fetch. Il
      // branch è spazialmente coerente (regione contigua), quindi economico
      // anche sulle GPU mobile a tile. Risparmia 8 texture fetch sulla maggior
      // parte dei pixel, su ogni dispositivo.
      if (blurMask <= 0.001) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      float radius   = blurMask * uBlurStr;

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
