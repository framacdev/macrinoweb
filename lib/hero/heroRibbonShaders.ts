import { ribbonSimplexNoiseGlsl } from '@/lib/hero/shaders/ribbonSimplexNoise.glsl'

export const heroRibbonVertexShader = /* glsl */ `
  uniform float u_time;
  uniform float u_speed;
  uniform vec2  u_resolution;

  uniform float u_twistFrequencyX;
  uniform float u_twistFrequencyY;
  uniform float u_twistFrequencyZ;
  uniform float u_twistPowerX;
  uniform float u_twistPowerY;
  uniform float u_twistPowerZ;

  uniform float u_displaceFrequencyX;
  uniform float u_displaceFrequencyZ;
  uniform float u_displaceAmount;

  uniform float u_displaceFrequencyY;
  uniform float u_displaceFrequencyZ2;
  uniform float u_displaceAmountPerp;

  uniform float u_displaceAmountZ;
  uniform float u_displaceFrequencyZD;

  varying vec2  v_uv;
  varying vec3  v_position;
  varying vec2  v_resolution;

  ${ribbonSimplexNoiseGlsl}

  float expStep(float x, float n) {
    return exp2(-exp2(n) * pow(x, n));
  }

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
    v_uv         = uv;
    v_resolution = u_resolution;

    vec3 pos = position.xyz;
    float t  = u_time * u_speed;

    float nL = ribbonSimplexNoise(vec2(pos.x * u_displaceFrequencyX + t,
                                 pos.z * u_displaceFrequencyZ + t));
    pos.y += u_displaceAmount * nL;

    float nP = ribbonSimplexNoise(vec2(pos.y * u_displaceFrequencyY + t * 0.7,
                                 pos.z * u_displaceFrequencyZ2 + t * 0.5));
    pos.x += u_displaceAmountPerp * nP;

    float nZ = ribbonSimplexNoise(vec2(pos.x * u_displaceFrequencyZD         + t * 0.6 + 31.7,
                                 pos.y * u_displaceFrequencyZD * 0.08  + t * 0.1 + 17.3));
    pos.z += u_displaceAmountZ * nZ;

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

export const heroRibbonFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D u_paletteTexture;

  uniform float u_colorSaturation;
  uniform float u_colorContrast;
  uniform float u_colorHueShift;

  uniform float u_noiseStrength;
  uniform float u_noiseFrequency;
  uniform float u_noiseColorAtten;
  uniform float u_parabolaPower;

  uniform float u_time;

  uniform float u_glowAmount;
  uniform float u_glowPower;
  uniform float u_glowRamp;
  uniform float u_glowIntensity;

  uniform float u_line2Count;
  uniform float u_line2Width;
  uniform float u_line2Opacity;
  uniform float u_line2SpeedX;
  uniform float u_line2AmpX;
  uniform float u_line2SpeedY;
  uniform float u_line2FreqY;
  uniform float u_line2OpacitySpeed;
  uniform float u_line2OpacityMin;

  varying vec2  v_uv;
  varying vec3  v_position;
  varying vec2  v_resolution;

  ${ribbonSimplexNoiseGlsl}

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

  vec3 surfaceColor(vec2 uv) {
    vec3 color = texture2D(u_paletteTexture, vec2(uv.x, uv.y)).rgb;
    float p = 1.0 - parabola(uv.y, u_parabolaPower);
    float n0 = ribbonSimplexNoise(vec2(v_uv.x * 0.5, v_uv.y * 0.1));
    float n1 = ribbonSimplexNoise(vec2(
      v_uv.x * (u_noiseFrequency + u_noiseFrequency * 0.5 * n0),
      v_uv.y * 4.0 * n0
    ));
    n1 = mapLinear(n1, -1.0, 1.0, 0.0, 1.0);
    color += (n1 * u_noiseStrength * (1.0 - color.b * u_noiseColorAtten) * p);
    return color;
  }

  void main() {
    vec2 dy = dFdy(v_uv);
    float pdy = dy.y * v_resolution.y * u_glowAmount;
    pdy = mapLinear(pdy, -1.0, 1.0, 0.0, 1.0);
    pdy = clamp(pdy, 0.0, 1.0);
    pdy = pow(pdy, u_glowPower);
    pdy = smoothstep(0.0, u_glowRamp, pdy);
    pdy = clamp(pdy, 0.0, 1.0);

    vec4 color = vec4(surfaceColor(v_uv), 1.0);

    color.rgb = contrastFn(color.rgb, u_colorContrast);
    color.rgb = desaturate(color.rgb, 1.0 - u_colorSaturation);
    color.rgb = hueShift(color.rgb, u_colorHueShift);

    color += (1.0 - pdy) * u_glowIntensity;

    float lineGlowB = 0.0;
    int nLinesB = int(clamp(u_line2Count, 0.0, 8.0));
    for (int i = 0; i < 8; i++) {
      if (i >= nLinesB) break;
      float fi    = float(i);
      float baseX = (fi + 0.5) / u_line2Count;
      float phase   = fi * 2.399 + 7.3;
      float opModB  = mix(u_line2OpacityMin, 1.0, sin(u_time * u_line2OpacitySpeed + phase * 1.3) * 0.5 + 0.5);
      float offsetX = sin(u_time * u_line2SpeedX + phase) * u_line2AmpX;
      float waveX   = sin(v_uv.y * u_line2FreqY + u_time * u_line2SpeedY + phase * 0.7) * u_line2AmpX * 0.4;
      float lineX   = baseX + offsetX + waveX;
      float dist    = abs(v_uv.x - lineX);
      float line    = smoothstep(u_line2Width, 0.0, dist);
      lineGlowB    += line * opModB;
    }
    lineGlowB = clamp(lineGlowB, 0.0, 1.0) * u_line2Opacity;

    color.rgb += vec3(lineGlowB);

    gl_FragColor = clamp(color, 0.0, 1.0);
  }
`
