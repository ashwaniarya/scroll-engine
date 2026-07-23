import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { ScrollState } from '../core/scrollController'
import { ShaderLayer } from './shaderLayer'

const NOOP_FRAGMENT = 'void main() { gl_FragColor = vec4(0.0); }'

function scrollState(progress: number): ScrollState {
  return { rawProgress: progress, smoothProgress: progress, velocity: 0, direction: 0 }
}

class OpacityProbeShaderLayer extends ShaderLayer {
  applyOpacity(value: number): void {
    this.applyOpacityToMaterials(value)
  }
}

describe('ShaderLayer', () => {
  it('merges user uniforms and keeps built-ins authoritative on collision', () => {
    const layer = new ShaderLayer('merge', {
      fragmentShader: NOOP_FRAGMENT,
      uniforms: { uStrength: { value: 2 }, uTime: { value: 99 } },
    })
    expect(layer.uniforms.uStrength?.value).toBe(2)
    expect(layer.uniforms.uTime.value).toBe(0)
    expect(layer.uniforms.uProgress.value).toBe(0)
    expect(layer.uniforms.uOpacity.value).toBe(1)
  })

  it('uses an orthographic camera and a non-depth transparent material', () => {
    const layer = new ShaderLayer('flags', { fragmentShader: NOOP_FRAGMENT })
    expect(layer.camera).toBeInstanceOf(THREE.OrthographicCamera)
    const quad = layer.scene.children[0] as THREE.Mesh
    const material = quad.material as THREE.ShaderMaterial
    expect(material.transparent).toBe(true)
    expect(material.depthTest).toBe(false)
    expect(material.depthWrite).toBe(false)
    expect(material.blending).toBe(THREE.NormalBlending)
    expect(quad.frustumCulled).toBe(false)
  })

  it('honors a custom blending mode', () => {
    const layer = new ShaderLayer('additive', {
      fragmentShader: NOOP_FRAGMENT,
      blending: THREE.AdditiveBlending,
    })
    const quad = layer.scene.children[0] as THREE.Mesh
    expect((quad.material as THREE.ShaderMaterial).blending).toBe(THREE.AdditiveBlending)
  })

  it('accumulates uTime across updates', () => {
    const layer = new ShaderLayer('time', { fragmentShader: NOOP_FRAGMENT })
    layer.update(0.5)
    layer.update(0.5)
    expect(layer.uniforms.uTime.value).toBe(1)
  })

  it('writes local progress into uProgress on scroll', () => {
    const layer = new ShaderLayer('progress', { fragmentShader: NOOP_FRAGMENT })
    layer.scrollRange = { start: 0.2, end: 0.6 }
    layer.notifyScroll(scrollState(0.4))
    expect(layer.uniforms.uProgress.value).toBeCloseTo(0.5, 10)
  })

  it('tracks viewport size in uResolution', () => {
    const layer = new ShaderLayer('resolution', { fragmentShader: NOOP_FRAGMENT })
    layer.resize({ width: 800, height: 600, devicePixelRatio: 2 })
    expect(layer.uniforms.uResolution.value.x).toBe(800)
    expect(layer.uniforms.uResolution.value.y).toBe(600)
  })

  it('redirects layer opacity into the uOpacity uniform', () => {
    const layer = new OpacityProbeShaderLayer('opacity', { fragmentShader: NOOP_FRAGMENT })
    layer.applyOpacity(0.4)
    expect(layer.uniforms.uOpacity.value).toBe(0.4)
  })
})
