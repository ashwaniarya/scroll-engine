import * as THREE from 'three'
import type { Viewport } from '../core/renderer'
import type { ScrollState } from '../core/scrollController'
import { ThreeLayer } from './threeLayer'

const FULLSCREEN_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export interface ShaderLayerOptions {
  fragmentShader: string
  uniforms?: Record<string, THREE.IUniform>
  blending?: THREE.Blending
}

type BuiltinUniforms = {
  uTime: THREE.IUniform<number>
  uProgress: THREE.IUniform<number>
  uOpacity: THREE.IUniform<number>
  uResolution: THREE.IUniform<THREE.Vector2>
}

export class ShaderLayer extends ThreeLayer {
  override readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  readonly uniforms: BuiltinUniforms & Record<string, THREE.IUniform>

  constructor(name: string, options: ShaderLayerOptions) {
    super(name)
    this.uniforms = {
      ...options.uniforms,
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uOpacity: { value: 1 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }
    const material = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: options.fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: options.blending ?? THREE.NormalBlending,
    })
    const fullscreenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    fullscreenQuad.frustumCulled = false
    this.scene.add(fullscreenQuad)
  }

  protected override onScroll(scroll: ScrollState): void {
    this.uniforms.uProgress.value = this.localProgress(scroll)
  }

  protected override onUpdate(deltaSeconds: number): void {
    this.uniforms.uTime.value += deltaSeconds
  }

  protected override onResize(viewport: Viewport): void {
    this.uniforms.uResolution.value.set(viewport.width, viewport.height)
  }

  protected override applyOpacityToMaterials(value: number): void {
    this.uniforms.uOpacity.value = value
  }
}
