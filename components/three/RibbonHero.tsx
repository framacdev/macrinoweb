'use client'

/**
 * RibbonHero — versione INSTRUMENTATA per diagnosi freeze.
 *
 * Aggiunge telemetria con timestamp ad ogni fase critica del mounting:
 *
 * [TIME] CHECK-1: React mount    → componente React istanziato
 * [TIME] CHECK-2: Canvas ready   → contesto WebGL ottenuto
 * [TIME] CHECK-3: GLB loaded     → mesh parsata, geometry estratta
 * [TIME] CHECK-4: First frame    → primo useFrame eseguito (= scene live)
 *
 * Tutti i log hanno il prefisso [RibbonHero] per essere facili da filtrare
 * nella console (digita "RibbonHero" nella search bar Console).
 *
 * REGOLE DI INTERPRETAZIONE:
 * - Se manca CHECK-1: il file non sta nemmeno girando (problema di import,
 *   webpack, dynamic import, ssr).
 * - Se manca CHECK-2: il Canvas non riesce a ottenere WebGL — driver
 *   bloccato, blacklist Chrome, oppure crash silenzioso del compositor.
 * - Se manca CHECK-3: GLTFLoader bloccato o crashato — file GLB non
 *   trovato (404), formato corrotto, o parsing infinito.
 * - Se manca CHECK-4: shader non compila o uniforms malformati. È la
 *   causa più probabile dato che la mesh è statica e dovrebbe partire.
 *
 * Le funzioni di logging sono no-op in produzione, controllate dal flag
 * IS_DEV. Webpack tree-shakes via tutto in build di prod.
 */

import { useRef, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { PerspectiveCamera, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { useControls, folder, button } from 'leva'
import {
  customRibbonVertexShader,
  customRibbonFragmentShader,
} from './custom-ribbon-shaders'
import { createPaletteTexture } from './palette-texture'

// ─────────────────────────────────────────────────────────────────────────────
// Telemetria
// ─────────────────────────────────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV === 'development'

// performance.now() ci dà timestamp in millisecondi con precisione fractional
// (es. 12345.678ms). Lo usiamo come "tempo da inizio pagina" così possiamo
// vedere quanto ci mette ogni step.
function logCheck(label: string, extra?: Record<string, unknown>) {
  if (!IS_DEV) return
  const ts = performance.now().toFixed(1)
  if (extra) {
    console.log(`[RibbonHero] +${ts}ms ${label}`, extra)
  } else {
    console.log(`[RibbonHero] +${ts}ms ${label}`)
  }
}

// CHECK-1 si emette al primo eval del modulo (caricamento del file).
// È PRIMA che React istanzi il componente. Ci dice solo che il file è arrivato.
logCheck('module loaded')

// ─────────────────────────────────────────────────────────────────────────────
// Tipi
// ─────────────────────────────────────────────────────────────────────────────

type RibbonControls = {
  twistFrequencyX: number
  twistFrequencyY: number
  twistFrequencyZ: number
  twistPowerX: number
  twistPowerY: number
  twistPowerZ: number
  displaceFrequencyX: number
  displaceFrequencyZ: number
  displaceAmount: number
  speed: number
  colorContrast: number
  colorSaturation: number
  colorHueShift: number
  glowAmount: number
  glowPower: number
  glowRamp: number
  noiseStrength: number
  noiseFreq: number
  positionX: number
  positionY: number
  positionZ: number
  rotationX: number
  rotationY: number
  rotationZ: number
  scaleX: number
  scaleY: number
  scaleZ: number
  color1: string
  color2: string
  color3: string
  color4: string
}

// ─────────────────────────────────────────────────────────────────────────────
// RibbonMesh
// ─────────────────────────────────────────────────────────────────────────────

function RibbonMesh({ controls }: { controls: RibbonControls }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  // Diagnostica errori di compilazione shader: ascolta l'evento
  // 'webglcontextlost' del canvas. Se la compilazione fallisce, il
  // context viene perso e questo evento spara.
  useEffect(() => {
    const checkShader = () => {
      if (!materialRef.current) return
      const mat = materialRef.current
      // Three.js esegue compilation lazy. Forziamo il check.
      const program = (mat as any).program
      logCheck('shader program check', {
        hasProgram: !!program,
        programGl: program?.cacheKey ?? 'none',
        materialNeedsUpdate: mat.needsUpdate,
        uniformsCount: Object.keys(mat.uniforms).length,
      })
    }
    // Check dopo 500ms (dopo che il renderer ha fatto almeno un tentativo)
    const t1 = setTimeout(checkShader, 500)
    const t2 = setTimeout(checkShader, 2000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])
  const textureRef = useRef<THREE.DataTexture | null>(null)
  const firstFrameLogged = useRef(false)
  const { size } = useThree()

  // Log al mount iniziale di RibbonMesh (DOPO che il Canvas R3F è pronto).
  // useEffect con [] = una sola volta, dopo il primo render.
  useEffect(() => {
    logCheck('CHECK-2: Canvas ready, RibbonMesh mounted')
    return () => {
      logCheck('RibbonMesh unmounted')
    }
  }, [])

  // ── GLB loading con telemetria ──────────────────────────────────────────
  // useLoader sincrono via Suspense. Il try/catch non funziona qui perché
  // l'errore viene "thrown" in modo Suspense-style. Per loggare il caricamento
  // usiamo una versione un po' verbose: un useEffect con timing.
  logCheck('about to call useLoader for GLB')
  const gltf = useLoader(GLTFLoader, '/models/custom-ribbon.glb')
  logCheck('CHECK-3: GLB loaded successfully', {
    sceneChildren: gltf.scene.children.length,
    sceneName: gltf.scene.name,
  })

  // Estrazione della geometry con telemetria sui counts
  const geometry = useMemo(() => {
    logCheck('extracting geometry from GLB scene')
    let geom: THREE.BufferGeometry | null = null
    let meshCount = 0
    gltf.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshCount++
        if (obj.geometry && !geom) geom = obj.geometry
      }
    })
    if (!geom) {
      logCheck('ERROR: no mesh found in GLB', { meshCount })
      throw new Error('No mesh geometry found in custom-ribbon.glb')
    }
    const g = geom as THREE.BufferGeometry
    const posAttr = g.getAttribute('position')
    logCheck('geometry extracted', {
      vertices: posAttr?.count ?? 'unknown',
      hasIndex: !!g.index,
      indexCount: g.index?.count ?? 0,
      attributes: Object.keys(g.attributes),
    })
    return g
  }, [gltf])

  // Palette texture
  const { color1, color2, color3, color4 } = controls
  const paletteTexture = useMemo(() => {
    if (textureRef.current) {
      textureRef.current.dispose()
    }
    const tex = createPaletteTexture(
      [
        { color: color1, position: 0.0 },
        { color: color2, position: 0.33 },
        { color: color3, position: 0.66 },
        { color: color4, position: 1.0 },
      ],
      256,
    )
    textureRef.current = tex
    return tex
  }, [color1, color2, color3, color4])

  useEffect(() => {
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }
    }
  }, [])

  // Uniforms iniziali. Stabili (deps vuote).
  const uniforms = useMemo(() => {
    logCheck('creating uniforms object')
    return {
      u_time:               { value: 0 },
      u_speed:              { value: 0.00004 },
      u_resolution:         { value: new THREE.Vector2(1920, 1080) },
      u_twistFrequencyX:    { value: -0.65 },
      u_twistFrequencyY:    { value: 0.41 },
      u_twistFrequencyZ:    { value: -0.58 },
      u_twistPowerX:        { value: 3.63 },
      u_twistPowerY:        { value: 0.7 },
      u_twistPowerZ:        { value: 3.95 },
      u_displaceFrequencyX: { value: 0.005831 },
      u_displaceFrequencyZ: { value: 0.016001 },
      u_displaceAmount:     { value: -7.821 },
      u_colorContrast:      { value: 1.0 },
      u_colorSaturation:    { value: 1.0 },
      u_colorHueShift:      { value: -0.00159 },
      u_glowAmount:         { value: 1.98 },
      u_glowPower:          { value: 0.806 },
      u_glowRamp:           { value: 0.834 },
      u_noiseStrength:      { value: 0.2 },
      u_noiseFreq:          { value: 600.0 },
      u_paletteTexture:     { value: null as THREE.Texture | null },
      u_mousePosition:      { value: new THREE.Vector2(0, 0) },
      u_clearColor:         { value: new THREE.Color(0, 0, 0) },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_paletteTexture.value = paletteTexture
    }
  }, [paletteTexture])

  // ── useFrame con telemetria del primo frame ─────────────────────────────
  // Questo è il check critico: se logghiamo "first frame", la pipeline funziona
  // end-to-end. Se NON logghiamo "first frame", la compilazione shader è morta.
  useFrame((_, delta) => {
    if (!materialRef.current) return

    if (!firstFrameLogged.current) {
      firstFrameLogged.current = true
      logCheck('CHECK-4: FIRST FRAME drawn — shader compiled and rendering')
    }

    const u = materialRef.current.uniforms
    u.u_time.value += delta * 1000
    u.u_speed.value              = controls.speed
    u.u_twistFrequencyX.value    = controls.twistFrequencyX
    u.u_twistFrequencyY.value    = controls.twistFrequencyY
    u.u_twistFrequencyZ.value    = controls.twistFrequencyZ
    u.u_twistPowerX.value        = controls.twistPowerX
    u.u_twistPowerY.value        = controls.twistPowerY
    u.u_twistPowerZ.value        = controls.twistPowerZ
    u.u_displaceFrequencyX.value = controls.displaceFrequencyX
    u.u_displaceFrequencyZ.value = controls.displaceFrequencyZ
    u.u_displaceAmount.value     = controls.displaceAmount
    u.u_colorContrast.value      = controls.colorContrast
    u.u_colorSaturation.value    = controls.colorSaturation
    u.u_colorHueShift.value      = controls.colorHueShift
    u.u_glowAmount.value         = controls.glowAmount
    u.u_glowPower.value          = controls.glowPower
    u.u_glowRamp.value           = controls.glowRamp
    u.u_noiseStrength.value      = controls.noiseStrength
    u.u_noiseFreq.value          = controls.noiseFreq
  })

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_resolution.value.set(size.width, size.height)
    }
  }, [size])

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[controls.positionX, controls.positionY, controls.positionZ]}
      rotation={[controls.rotationX, controls.rotationY, controls.rotationZ]}
      scale={[controls.scaleX, controls.scaleY, controls.scaleZ]}
      renderOrder={-10}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          void main() {
            gl_FragColor = vec4(0.13, 0.45, 0.83, 1.0);
          }
        `}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene
// ─────────────────────────────────────────────────────────────────────────────

function Scene() {
  const controls = useControls({
    'Trasformazione (Stripe usa: pos=380,-301.7,-11.1 rot=-0.45,-0.12,1.87 scale=9,8,5)': folder({
      positionX: { value: 380,    min: -2000, max: 2000, step: 1 },
      positionY: { value: -301.7, min: -2000, max: 2000, step: 1 },
      positionZ: { value: -11.1,  min: -200,  max: 200,  step: 0.1 },
      rotationX: { value: -0.4496, min: -3.14, max: 3.14, step: 0.001 },
      rotationY: { value: -0.1176, min: -3.14, max: 3.14, step: 0.001 },
      rotationZ: { value: 1.8744,  min: -3.14, max: 3.14, step: 0.001 },
      scaleX:    { value: 9,  min: 0.1, max: 50, step: 0.1 },
      scaleY:    { value: 8,  min: 0.1, max: 50, step: 0.1 },
      scaleZ:    { value: 5,  min: 0.1, max: 50, step: 0.1 },
    }, { collapsed: false }),

    'Twist (vertex shader — 3 rotazioni)': folder({
      twistFrequencyX: { value: -0.65, min: -3, max: 3, step: 0.01 },
      twistFrequencyY: { value: 0.41,  min: -3, max: 3, step: 0.01 },
      twistFrequencyZ: { value: -0.58, min: -3, max: 3, step: 0.01 },
      twistPowerX:     { value: 3.63,  min: 0,  max: 10, step: 0.01 },
      twistPowerY:     { value: 0.7,   min: 0,  max: 10, step: 0.01 },
      twistPowerZ:     { value: 3.95,  min: 0,  max: 10, step: 0.01 },
    }, { collapsed: true }),

    'Displace (simplex noise sull\'asse Y)': folder({
      displaceFrequencyX: { value: 0.005831, min: 0,    max: 0.05, step: 0.0001 },
      displaceFrequencyZ: { value: 0.016001, min: 0,    max: 0.05, step: 0.0001 },
      displaceAmount:     { value: -7.821,   min: -50,  max: 50,   step: 0.01 },
    }, { collapsed: true }),

    'Animazione (speed 0.00004 = lentissimo)': folder({
      speed: { value: 0.00004, min: 0, max: 0.001, step: 0.000001 },
    }, { collapsed: true }),

    'Colore — palette MacrinoWeb': folder({
      color1: { value: '#3da9fc' },
      color2: { value: '#2273D4' },
      color3: { value: '#1A5BB8' },
      color4: { value: '#094067' },
    }, { collapsed: false }),

    'Color grading': folder({
      colorContrast:   { value: 1.0,     min: 0,    max: 3,   step: 0.01 },
      colorSaturation: { value: 1.0,     min: 0,    max: 2,   step: 0.01 },
      colorHueShift:   { value: -0.00159, min: -3.14, max: 3.14, step: 0.001 },
    }, { collapsed: true }),

    'Glow (luminescenza sui bordi via dFdy)': folder({
      glowAmount: { value: 1.98,  min: 0, max: 10,  step: 0.01 },
      glowPower:  { value: 0.806, min: 0, max: 5,   step: 0.001 },
      glowRamp:   { value: 0.834, min: 0, max: 2,   step: 0.001 },
    }, { collapsed: true }),

    'Surface noise': folder({
      noiseStrength: { value: 0.2,   min: 0,   max: 2,    step: 0.01 },
      noiseFreq:     { value: 600.0, min: 10,  max: 2000, step: 1 },
    }, { collapsed: true }),

    Reset: button(() => {
      console.log('Reset clicked')
    }),
  }) as RibbonControls

  return <RibbonMesh controls={controls} />
}

// ─────────────────────────────────────────────────────────────────────────────
// RibbonHero entry point
// ─────────────────────────────────────────────────────────────────────────────

export default function RibbonHero() {
  // CHECK-1: il componente React è montato
  // Lo metto qui all'interno della funzione perché il modulo-level log è
  // troppo presto (potrebbe non aver ancora effetti visibili).
  useEffect(() => {
    logCheck('CHECK-1: RibbonHero React mount')
    return () => {
      logCheck('RibbonHero React unmount')
    }
  }, [])

  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      onCreated={(state) => {
        const gl = state.gl as THREE.WebGLRenderer
        const ctx = gl.getContext()
        logCheck('Canvas onCreated callback', {
          isWebGL2: gl.capabilities.isWebGL2,
          maxTextureSize: gl.capabilities.maxTextureSize,
          maxVertexUniforms: gl.capabilities.maxVertexUniforms,
          maxAttributes: gl.capabilities.maxAttributes,
          renderer: (ctx.getParameter(ctx.RENDERER) as string) ?? 'unknown',
          vendor: (ctx.getParameter(ctx.VENDOR) as string) ?? 'unknown',
        })

        // ASCOLTATORI EVENTI WebGL — rilevano shader crash
        const canvas = gl.domElement
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          console.error('[RibbonHero] ⚠️ WebGL context LOST', e)
        })
        canvas.addEventListener('webglcontextrestored', () => {
          console.warn('[RibbonHero] WebGL context restored')
        })

        // Errori shader compilation: setto il logger interno di Three.js
        gl.debug.checkShaderErrors = true
      }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 1500]}
        fov={50}
        near={1}
        far={5000}
      />

      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
    </Canvas>
  )
}