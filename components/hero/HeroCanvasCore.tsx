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
  MOBILE_LANDSCAPE_MQ,
  MOBILE_LANDSCAPE_PRESET,
} from '@/lib/hero/heroMobileLandscapePreset'
import { resolveHeroCanvasQuality } from '@/lib/hero/heroCanvasQuality'
import { heroRibbonRadialBlurShader } from '@/lib/hero/heroRibbonRadialBlur'
import {
  heroRibbonFragmentShader,
  heroRibbonVertexShader,
} from '@/lib/hero/heroRibbonShaders'

export type HeroCanvasProps = {
  onCanvasReady?: () => void
}

export type HeroCanvasCoreProps = HeroCanvasProps & {
  ctrlRef: React.RefObject<HeroRibbonControls>
  /**
   * Chiamato quando cambia `matches` della media query mobile landscape.
   * In dev: usare per allineare Leva al preset senza bloccare gli slider dopo.
   */
  onMobileLandscapeMatchChange?: (matches: boolean) => void
}

export function HeroCanvasCore({
  ctrlRef,
  onCanvasReady,
  onMobileLandscapeMatchChange,
}: HeroCanvasCoreProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const isMobileLandscapeRef = useRef(false)
  const onCanvasReadyRef = useRef(onCanvasReady)
  const onMlRef = useRef(onMobileLandscapeMatchChange)
  useEffect(() => {
    onCanvasReadyRef.current = onCanvasReady
  }, [onCanvasReady])
  useEffect(() => {
    onMlRef.current = onMobileLandscapeMatchChange
  }, [onMobileLandscapeMatchChange])

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current

    const mq = window.matchMedia(MOBILE_LANDSCAPE_MQ)
    let prevMqMatches: boolean | undefined
    const syncMobileLandscape = () => {
      const next = mq.matches
      isMobileLandscapeRef.current = next
      if (prevMqMatches !== next) {
        prevMqMatches = next
        onMlRef.current?.(next)
      }
    }
    syncMobileLandscape()
    mq.addEventListener('change', syncMobileLandscape)

    const quality = resolveHeroCanvasQuality()

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      ctrlRef.current.camFov,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    )
    const hardPresetInit =
      process.env.NODE_ENV === 'production' && isMobileLandscapeRef.current
    camera.position.z = hardPresetInit
      ? MOBILE_LANDSCAPE_PRESET.camZ
      : ctrlRef.current.camZ

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    const pixelRatio = Math.min(window.devicePixelRatio, quality.pixelRatioCap)
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

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
        requestAnimationFrame(() => fireCanvasReadyOnce())
      },
      undefined,
      () => {
        console.warn(
          'HeroCanvas: palette non trovata in /public/textures/ribbon3.png'
        )
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
        value: new THREE.Vector2(mount.clientWidth, mount.clientHeight),
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
    ribbon.rotation.z = c0.rotZ
    const mlInit = hardPresetInit
    ribbon.position.set(
      mlInit ? MOBILE_LANDSCAPE_PRESET.posX : c0.posX,
      mlInit ? MOBILE_LANDSCAPE_PRESET.posY : c0.posY,
      0
    )
    ribbon.scale.setScalar(mlInit ? MOBILE_LANDSCAPE_PRESET.scale : c0.scale)
    scene.add(ribbon)

    const wPx = Math.floor(mount.clientWidth * pixelRatio)
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
      mount.clientWidth,
      mount.clientHeight
    )
    composer.addPass(blurPass)

    const clock = new THREE.Clock()
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

      const t = clock.getElapsedTime()
      const c = ctrlRef.current

      const useHardPreset =
        process.env.NODE_ENV === 'production' && isMobileLandscapeRef.current
      const camZ = useHardPreset ? MOBILE_LANDSCAPE_PRESET.camZ : c.camZ
      const posX = useHardPreset ? MOBILE_LANDSCAPE_PRESET.posX : c.posX
      const posY = useHardPreset ? MOBILE_LANDSCAPE_PRESET.posY : c.posY
      const scale = useHardPreset ? MOBILE_LANDSCAPE_PRESET.scale : c.scale

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
      ribbon.position.set(posX, posY, 0)
      ribbon.scale.setScalar(scale)
      ribbon.updateMatrixWorld()

      blurPass.uniforms['uBlurStr'].value = c.blurStr
      blurPass.uniforms['uVignetteLeft'].value = useHardPreset
        ? MOBILE_LANDSCAPE_PRESET.vignetteLeft
        : c.vignetteLeft
      blurPass.uniforms['uVignetteBottom'].value = useHardPreset
        ? MOBILE_LANDSCAPE_PRESET.vignetteBottom
        : c.vignetteBottom

      if (camera.fov !== c.camFov || camera.position.z !== camZ) {
        camera.fov = c.camFov
        camera.position.z = camZ
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

    const onResize = () => {
      syncMobileLandscape()
      const w = mount.clientWidth,
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
    }
    window.addEventListener('resize', onResize)

    return () => {
      stopLoop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      mq.removeEventListener('change', syncMobileLandscape)
      window.removeEventListener('resize', onResize)
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      texture.dispose()
      msaaTarget.dispose()
      renderer.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init una tantum; ctrlRef.current ogni frame
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 'calc(-1 * 76px) 0 0 0',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-bg)',
        transition: 'background-color 0.3s ease',
      }}
    />
  )
}
