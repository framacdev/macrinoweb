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
import { resolveHeroCanvasQuality } from '@/lib/hero/heroCanvasQuality'
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
}

export function HeroCanvasCore({
  ctrlRef,
  onCanvasReady,
}: HeroCanvasCoreProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const onCanvasReadyRef = useRef(onCanvasReady)
  useEffect(() => {
    onCanvasReadyRef.current = onCanvasReady
  }, [onCanvasReady])

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current

    const quality = resolveHeroCanvasQuality()

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
    })
    const pixelRatio = Math.min(window.devicePixelRatio, quality.pixelRatioCap)
    renderer.setPixelRatio(pixelRatio)
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
        // Force GPU upload so the first visible frame already has the texture.
        renderer.initTexture(texture)
        mount.style.opacity = '1'
        fireCanvasReadyOnce()
      },
      undefined,
      () => {
        console.warn(
          'HeroCanvas: palette non trovata in /public/textures/ribbon3.png'
        )
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

    const wPx = Math.floor(initW * pixelRatio)
    const hPx = Math.floor(mount.clientHeight * pixelRatio)
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

    const timer = new THREE.Timer()
    timer.connect(document)
    let rafId = 0
    let heroIntersecting = true

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
      if (!canRender()) return

      timer.update()
      const t = timer.getElapsed()
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
      if (canRender()) rafId = requestAnimationFrame(tick)
    }

    const startLoop = () => {
      if (rafId || !canRender()) return
      rafId = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        heroIntersecting = !!e?.isIntersecting
        if (canRender()) startLoop()
        else stopLoop()
      },
      { root: null, threshold: 0, rootMargin: '100px 0px 120px 0px' }
    )
    io.observe(mount)

    const onVisibility = () => {
      if (canRender()) startLoop()
      else stopLoop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    startLoop()

    // Stop the animation loop while the window is being resized to avoid
    // rAF violations caused by the browser's GPU compositor stalling WebGL
    // during compositing layer resize. Resume after 150ms of quiet.
    let resizeDebounceId: ReturnType<typeof setTimeout> | null = null
    const executeResize = () => {
      resizeDebounceId = null
      // WHY: stopLoop() garantisce che nessun tick() sia in volo mentre
      // aggiorgiamo camera.aspect, renderer size e composer size.
      // Il RAF era già fermato da onResize, ma onVisibility potrebbe averlo
      // riavviato durante il debounce window di 150ms.
      stopLoop()
      // WHY: stessa costante MIN_CANVAS_W usata al mount — il canvas non
      // scende mai sotto 768px. mount.clientWidth = viewport_width perché
      // il mount div è width:100% senza min-width CSS (vedi return JSX).
      // camera.aspect qui sotto è ciò che fa scalare la scena desktop sui
      // viewport più piccoli, senza preset per-device.
      const w = Math.max(mount.clientWidth, MIN_CANVAS_W),
        h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      const pr = Math.min(window.devicePixelRatio, quality.pixelRatioCap)
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
        // WHY: usa la CSS custom property --hero-nav-h (definita in globals.css
        // con media query) — il valore è corretto fin dal primo render SSR,
        // senza flash post-hydration. 76px desktop, 64px mobile/tablet (≤ 1024px).
        inset: 'calc(-1 * var(--hero-nav-h)) 0 0 0',
        width: '100%',
        height: '100%',
        // WHY: overflow:hidden clippa il canvas (renderizzato a min 768px)
        // quando il viewport è più stretto, senza espandere il document width
        // né causare browser auto-zoom. Il bleed dietro la navbar è preservato
        // perché il clip avviene sui bordi del mount div, che già estende
        // sopra la section dell'altezza corretta della navbar.
        overflow: 'hidden',
      }}
    />
  )
}
