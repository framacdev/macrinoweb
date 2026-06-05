'use client'

/**
 * Core Three.js del ribbon: nessuna dipendenza da Leva.
 * I controlli arrivano da `ctrlRef` (Leva in dev, valori statici in prod).
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

import type { HeroRibbonControls } from '@/lib/hero/heroControlDefaults'
import {
  resolveHeroCanvasQuality,
  HERO_CAPTURE_QUALITY,
} from '@/lib/hero/heroCanvasQuality'
import { heroRibbonRadialBlurShader } from '@/lib/hero/heroRibbonRadialBlur'
import {
  heroRibbonFragmentShader,
  heroRibbonVertexShader,
} from '@/lib/hero/heroRibbonShaders'

// WHY: larghezza minima di render (minimo device supportato) — a module scope
// anziché nel closure del useEffect, così è visibile e documentata. È anche il
// meccanismo di scaling automatico: il ribbon è una sola scena tarata sui valori
// desktop; su viewport più stretti la camera.aspect si adatta e il canvas (mai
// sotto 768px) viene clippato da overflow:hidden, senza preset per-device.
const MIN_CANVAS_W = 768 as const

export type HeroCanvasProps = {
  onCanvasReady?: () => void
}

export type HeroCanvasCoreProps = HeroCanvasProps & {
  ctrlRef: React.RefObject<HeroRibbonControls>
  /**
   * Modalità cattura (route `/ribbon-capture`): preserveDrawingBuffer attivo,
   * frame congelato a t=0, nessun offset navbar (il canvas == box del poster),
   * qualità massima a pixelRatio 1. Solo per generare i poster, mai in prod.
   */
  captureMode?: boolean
}

export function HeroCanvasCore({
  ctrlRef,
  onCanvasReady,
  captureMode = false,
}: HeroCanvasCoreProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const onCanvasReadyRef = useRef(onCanvasReady)
  useEffect(() => {
    onCanvasReadyRef.current = onCanvasReady
  }, [onCanvasReady])

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current

    // prefers-reduced-motion: ribbon congelato su un singolo frame (t=0) —
    // zero costo CPU/GPU a riposo e nessun movimento full-screen (a11y).
    // captureMode (route /ribbon-capture) usa lo stesso freeze.
    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const freeze = captureMode || reduceMotion

    const quality = captureMode
      ? HERO_CAPTURE_QUALITY
      : resolveHeroCanvasQuality()

    // WHY: la larghezza minima è imposta in JS, NON via CSS min-width.
    // Un min-width CSS su un elemento position:absolute espande il document
    // width, causando horizontal scroll e il browser auto-zoom su viewport
    // stretti. Con initW clampato in JS il DOM rimane invariato; il clipping
    // è gestito da overflow:hidden sul mount div stesso (vedi return JSX).
    const initW = Math.max(mount.clientWidth, MIN_CANVAS_W)

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      ctrlRef.current.camFov,
      initW / mount.clientHeight,
      0.1,
      100
    )
    camera.position.z = ctrlRef.current.camZ

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      // preserveDrawingBuffer solo in cattura: serve a canvas.toBlob() per
      // leggere il frame. In produzione resta false (nessun costo di memoria).
      preserveDrawingBuffer: captureMode,
    })
    // pixelRatio fisso (cap dal tier qualità). WHY: il governor NON lo abbassa
    // più a runtime — a risoluzione dimezzata il glow dFdy aliasa (strobo, vedi
    // tick). Resta costante per tutta la vita della scena (anche sui resize).
    const currentPixelRatio = Math.min(
      window.devicePixelRatio,
      quality.pixelRatioCap
    )
    renderer.setPixelRatio(currentPixelRatio)
    renderer.setSize(initW, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)
    mount.style.opacity = '0'

    const geometry = new THREE.PlaneGeometry(
      1,
      6,
      quality.ribbonSegmentsCross,
      quality.ribbonSegmentsAlong
    )

    let canvasReadyFired = false
    const fireCanvasReadyOnce = () => {
      if (canvasReadyFired) return
      canvasReadyFired = true
      onCanvasReadyRef.current?.()
    }

    const texture = new THREE.TextureLoader().load(
      '/textures/ribbon3.png',
      () => {
        renderer.initTexture(texture)
        // Freeze (reduced-motion / cattura): renderizza l'unico frame ORA, con
        // la texture già caricata, così il poster/immagine statica è completa.
        if (freeze) startLoop()
        mount.style.opacity = '1'
        fireCanvasReadyOnce()
      },
      undefined,
      () => {
        console.warn(
          'HeroCanvas: palette non trovata in /public/textures/ribbon3.png'
        )
        if (freeze) startLoop()
        mount.style.opacity = '1'
        fireCanvasReadyOnce()
      }
    )
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.colorSpace = THREE.SRGBColorSpace

    const c0 = ctrlRef.current
    const uniforms: Record<string, THREE.IUniform> = {
      u_time: { value: 0 },
      u_speed: { value: c0.speed },
      u_resolution: {
        value: new THREE.Vector2(initW, mount.clientHeight),
      },

      u_paletteTexture: { value: texture },

      u_twistFrequencyX: { value: c0.twistFrequencyX },
      u_twistFrequencyY: { value: c0.twistFrequencyY },
      u_twistFrequencyZ: { value: c0.twistFrequencyZ },
      u_twistPowerX: { value: c0.twistPowerX },
      u_twistPowerY: { value: c0.twistPowerY },
      u_twistPowerZ: { value: c0.twistPowerZ },

      u_displaceFrequencyX: { value: c0.displaceFrequencyX },
      u_displaceFrequencyZ: { value: c0.displaceFrequencyZ },
      u_displaceAmount: { value: c0.displaceAmount },

      u_displaceFrequencyY: { value: c0.displaceFrequencyY },
      u_displaceFrequencyZ2: { value: c0.displaceFrequencyZ2 },
      u_displaceAmountPerp: { value: c0.displaceAmountPerp },

      u_displaceAmountZ: { value: c0.displaceAmountZ },
      u_displaceFrequencyZD: { value: c0.displaceFrequencyZD },

      u_colorSaturation: { value: c0.colorSaturation },
      u_colorContrast: { value: c0.colorContrast },
      u_colorHueShift: { value: c0.colorHueShift },

      u_glowAmount: { value: c0.glowAmount },
      u_glowPower: { value: c0.glowPower },
      u_glowRamp: { value: c0.glowRamp },
      u_glowIntensity: { value: c0.glowIntensity },

      u_line2Count: { value: c0.line2Count },
      u_line2Width: { value: c0.line2Width },
      u_line2Opacity: { value: c0.line2Opacity },
      u_line2SpeedX: { value: c0.line2SpeedX },
      u_line2AmpX: { value: c0.line2AmpX },
      u_line2SpeedY: { value: c0.line2SpeedY },
      u_line2FreqY: { value: c0.line2FreqY },
      u_line2OpacitySpeed: { value: c0.line2OpacitySpeed },
      u_line2OpacityMin: { value: c0.line2OpacityMin },

      u_noiseStrength: { value: c0.noiseStrength },
      u_noiseFrequency: { value: c0.noiseFrequency },
      u_noiseColorAtten: { value: c0.noiseColorAtten },
      u_parabolaPower: { value: c0.parabolaPower },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: heroRibbonVertexShader,
      fragmentShader: heroRibbonFragmentShader,
      side: THREE.DoubleSide,
      transparent: false,
    })

    const ribbon = new THREE.Mesh(geometry, material)
    // WHY: posa iniziale dai valori desktop (unica fonte). Impostata già qui,
    // non solo nel tick, così il primo frame è già nella posa corretta.
    ribbon.rotation.set(c0.rotX, c0.rotY, c0.rotZ)
    ribbon.position.set(c0.posX, c0.posY, 0)
    ribbon.scale.setScalar(c0.scale)
    scene.add(ribbon)

    const wPx = Math.floor(initW * currentPixelRatio)
    const hPx = Math.floor(mount.clientHeight * currentPixelRatio)
    const msaaTarget = new THREE.WebGLRenderTarget(wPx, hPx, {
      samples: quality.msaaSamples,
    })
    const composer = new EffectComposer(renderer, msaaTarget)
    composer.addPass(new RenderPass(scene, camera))

    let fxaaPass: ShaderPass | null = null
    if (quality.fxaa) {
      fxaaPass = new ShaderPass(FXAAShader)
      ;(fxaaPass.uniforms['resolution'].value as THREE.Vector2).set(
        1 / wPx,
        1 / hPx
      )
      composer.addPass(fxaaPass)
    }

    const blurPass = new ShaderPass(heroRibbonRadialBlurShader)
    ;(blurPass.uniforms['uResolution'].value as THREE.Vector2).set(
      initW,
      mount.clientHeight
    )
    composer.addPass(blurPass)

    // Riscalatura runtime (resize + governor): aggiorna renderer, composer,
    // MSAA target e uniform di risoluzione a un dato pixel ratio. NON tocca la
    // geometria. mount.clientWidth è clampato a MIN_CANVAS_W come al mount.
    const setRenderScale = (pr: number) => {
      const w = Math.max(mount.clientWidth, MIN_CANVAS_W)
      const h = mount.clientHeight
      renderer.setPixelRatio(pr)
      renderer.setSize(w, h)
      composer.setSize(w, h)
      const ww = Math.floor(w * pr)
      const hh = Math.floor(h * pr)
      msaaTarget.setSize(ww, hh)
      if (fxaaPass) {
        ;(fxaaPass.uniforms['resolution'].value as THREE.Vector2).set(
          1 / ww,
          1 / hh
        )
      }
      ;(uniforms.u_resolution.value as THREE.Vector2).set(w, h)
      ;(blurPass.uniforms['uResolution'].value as THREE.Vector2).set(w, h)
    }

    // ── Governor adattivo ────────────────────────────────────────────────────
    // Misura il frame time reale e degrada il FILL RATE (prima DPR, poi FXAA)
    // se le prestazioni scendono sotto soglia. Mai la geometria: i vertici non
    // sono il collo di bottiglia. Rete di sicurezza per i device sovrastimati
    // dalla classificazione statica di resolveHeroCanvasQuality().
    const PERF_WARMUP = 20 // frame iniziali ignorati (spike di caricamento)
    const PERF_WINDOW = 60 // ampiezza finestra di misura (~1s a 60fps)
    const PERF_MIN_FPS = 45 // sotto questa media → degrada di un livello
    let perfLast = 0
    let perfAccum = 0
    let perfWindowFrames = 0
    let perfPhaseFrames = 0
    let degradeLevel = 0

    const timer = new THREE.Timer()
    timer.connect(document)
    let rafId = 0
    let heroIntersecting = true
    // Tempo d'animazione accumulato con passo per-frame clampato (vedi tick).
    // Robusto a rAF irregolare (DevTools aperti, throttling, device lenti):
    // evita i salti di u_time che fanno strobare le linee di luce sottili.
    let animTime = 0

    const canRender = () =>
      document.visibilityState === 'visible' && heroIntersecting

    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const tick = () => {
      rafId = 0
      if (!freeze && !canRender()) return

      if (!freeze) {
        timer.update()
        // WHY: clamp del passo a 1/30s. Con rAF a raffica/stalli (DevTools aperti,
        // throttling, device lenti, ripresa dopo resize) il delta reale può fare
        // salti enormi → u_time salterebbe e le linee di luce strobano. Col tetto
        // l'animazione rallenta in modo fluido invece di saltare. Gli shader usano
        // u_time solo come fase: conta l'avanzamento regolare, non il valore assoluto.
        animTime += Math.min(timer.getDelta(), 1 / 30)
      }
      const t = freeze ? 0 : animTime
      const c = ctrlRef.current

      uniforms.u_time.value = t
      uniforms.u_speed.value = c.speed

      uniforms.u_twistFrequencyX.value = c.twistFrequencyX
      uniforms.u_twistFrequencyY.value = c.twistFrequencyY
      uniforms.u_twistFrequencyZ.value = c.twistFrequencyZ
      uniforms.u_twistPowerX.value = c.twistPowerX
      uniforms.u_twistPowerY.value = c.twistPowerY
      uniforms.u_twistPowerZ.value = c.twistPowerZ

      uniforms.u_displaceFrequencyX.value = c.displaceFrequencyX
      uniforms.u_displaceFrequencyZ.value = c.displaceFrequencyZ
      uniforms.u_displaceAmount.value = c.displaceAmount

      uniforms.u_displaceFrequencyY.value = c.displaceFrequencyY
      uniforms.u_displaceFrequencyZ2.value = c.displaceFrequencyZ2
      uniforms.u_displaceAmountPerp.value = c.displaceAmountPerp

      uniforms.u_displaceAmountZ.value = c.displaceAmountZ
      uniforms.u_displaceFrequencyZD.value = c.displaceFrequencyZD

      uniforms.u_colorSaturation.value = c.colorSaturation
      uniforms.u_colorContrast.value = c.colorContrast
      uniforms.u_colorHueShift.value = c.colorHueShift

      uniforms.u_glowAmount.value = c.glowAmount
      uniforms.u_glowPower.value = c.glowPower
      uniforms.u_glowRamp.value = c.glowRamp
      uniforms.u_glowIntensity.value = c.glowIntensity

      uniforms.u_line2Count.value = c.line2Count
      uniforms.u_line2Width.value = c.line2Width
      uniforms.u_line2Opacity.value = c.line2Opacity
      uniforms.u_line2SpeedX.value = c.line2SpeedX
      uniforms.u_line2AmpX.value = c.line2AmpX
      uniforms.u_line2SpeedY.value = c.line2SpeedY
      uniforms.u_line2FreqY.value = c.line2FreqY
      uniforms.u_line2OpacitySpeed.value = c.line2OpacitySpeed
      uniforms.u_line2OpacityMin.value = c.line2OpacityMin

      uniforms.u_noiseStrength.value = c.noiseStrength
      uniforms.u_noiseFrequency.value = c.noiseFrequency
      uniforms.u_noiseColorAtten.value = c.noiseColorAtten
      uniforms.u_parabolaPower.value = c.parabolaPower

      ribbon.rotation.x = c.rotX
      ribbon.rotation.y = c.rotY
      ribbon.rotation.z = c.rotZ
      ribbon.position.set(c.posX, c.posY, 0)
      ribbon.scale.setScalar(c.scale)
      ribbon.updateMatrixWorld()

      blurPass.uniforms['uBlurStr'].value = c.blurStr
      blurPass.uniforms['uVignetteLeft'].value = c.vignetteLeft
      blurPass.uniforms['uVignetteBottom'].value = c.vignetteBottom

      if (camera.fov !== c.camFov || camera.position.z !== c.camZ) {
        camera.fov = c.camFov
        camera.position.z = c.camZ
        camera.updateProjectionMatrix()
      }

      composer.render()

      // Frame singolo (reduced-motion o cattura): non rischedulare.
      if (freeze) return

      // Governor: campiona il frame time dopo il warmup e, a finestra piena,
      // degrada se la media è sotto soglia → spegne FXAA.
      // WHY: NON abbassa più il pixelRatio. A risoluzione dimezzata la derivata
      // dFdy del glow (heroRibbonShaders) diventa rumorosa e aliasa NEL TEMPO →
      // strobo del glow sotto carico / con i DevTools aperti. FXAA è
      // post-process, non tocca la risoluzione del derivative → leva sicura.
      // Il blur resta (ha già l'early-out) per non perdere la vignetta. La
      // protezione perf di base resta nei tier iniziali (segmenti/MSAA/cap DPR).
      const now = performance.now()
      const dt = perfLast ? now - perfLast : 0
      perfLast = now
      if (dt > 0) {
        perfPhaseFrames++
        if (perfPhaseFrames > PERF_WARMUP) {
          perfAccum += dt
          perfWindowFrames++
          if (perfWindowFrames >= PERF_WINDOW) {
            const fps = (perfWindowFrames * 1000) / perfAccum
            if (fps < PERF_MIN_FPS && degradeLevel < 1) {
              degradeLevel++
              if (fxaaPass) fxaaPass.enabled = false
              perfPhaseFrames = 0 // re-warmup dopo lo spegnimento di FXAA
            }
            perfAccum = 0
            perfWindowFrames = 0
          }
        }
      }

      if (canRender()) rafId = requestAnimationFrame(tick)
    }

    const startLoop = () => {
      if (freeze) {
        // Reduced-motion / cattura: renderizza un solo frame, nessun loop.
        tick()
        return
      }
      if (rafId || !canRender()) return
      // Reset della finestra a ogni (ri)avvio: dopo una pausa il primo dt è
      // enorme e falserebbe il governor.
      perfLast = 0
      perfPhaseFrames = 0
      rafId = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (freeze) return // frame statico: niente start/stop legati allo scroll
        const e = entries[0]
        heroIntersecting = !!e?.isIntersecting
        if (canRender()) startLoop()
        else stopLoop()
      },
      { root: null, threshold: 0, rootMargin: '100px 0px 120px 0px' }
    )
    io.observe(mount)

    const onVisibility = () => {
      if (freeze) return
      if (canRender()) startLoop()
      else stopLoop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Non-freeze: avvia il loop. Freeze: il frame singolo parte al load della
    // texture (vedi onload), così cattura/poster includono già la palette.
    if (!freeze) startLoop()

    // Stop the animation loop while the window is being resized to avoid
    // rAF violations caused by the browser's GPU compositor stalling WebGL
    // during compositing layer resize. Resume after 150ms of quiet.
    let resizeDebounceId: ReturnType<typeof setTimeout> | null = null
    const executeResize = () => {
      resizeDebounceId = null
      // WHY: stopLoop() garantisce che nessun tick() sia in volo mentre
      // aggiorniamo camera.aspect e le dimensioni di render.
      stopLoop()
      // WHY: MIN_CANVAS_W — il canvas non scende mai sotto 768px; camera.aspect
      // è ciò che scala la scena desktop sui viewport più stretti, senza preset.
      const w = Math.max(mount.clientWidth, MIN_CANVAS_W)
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      // WHY: mantiene currentPixelRatio — se il governor l'ha già abbassato a 1,
      // una rotazione/resize non deve riportarlo su.
      setRenderScale(currentPixelRatio)
      startLoop()
    }
    const onResize = () => {
      stopLoop()
      if (resizeDebounceId) clearTimeout(resizeDebounceId)
      resizeDebounceId = setTimeout(executeResize, 150)
    }
    window.addEventListener('resize', onResize)

    return () => {
      if (resizeDebounceId) clearTimeout(resizeDebounceId)
      stopLoop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      texture.dispose()
      msaaTarget.dispose()
      // WHY: composer.dispose() rilascia il readBuffer interno di EffectComposer
      // (un WebGLRenderTarget separato da msaaTarget/writeBuffer) che altrimenti
      // resterebbe in GPU memory indefinitamente dopo l'unmount.
      composer.dispose()
      renderer.dispose()
      timer.disconnect()
      timer.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init una tantum; ctrlRef.current ogni frame
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        // WHY: top/right/bottom/left definiscono i quattro bordi del mount div.
        // top negativo crea il bleed dietro la navbar (il canvas parte da sopra
        // la section). Senza height esplicito, CSS stretch risolve correttamente:
        // altezza = parent_height + hero-nav-h → copre tutta la section PIÙ
        // la fascia navbar. height:100% era over-constrained (top+height+bottom
        // tutti non-auto → CSS ignorava bottom → canvas 64/76px corto in fondo).
        // In cattura inset:0 — il canvas coincide col box del poster, così
        // canvas.toBlob() esporta esattamente le dimensioni del poster.
        inset: captureMode ? '0' : 'calc(-1 * var(--hero-nav-h)) 0 0 0',
        width: '100%',
        // WHY: overflow:hidden clippa il canvas (renderizzato a min 768px)
        // quando il viewport è più stretto, senza espandere il document width
        // né causare browser auto-zoom.
        overflow: 'hidden',
      }}
    />
  )
}
