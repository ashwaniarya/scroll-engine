import * as THREE from 'three'
import type { LayerRenderer, Viewport } from '../core/renderer'
import { singletonAccess } from '../core/singleton'
import type { ThreeLayer } from '../layers/threeLayer'

export class ThreeRenderer implements LayerRenderer {
  private static readonly access = singletonAccess<ThreeRenderer>('ThreeRenderer')

  static create(): ThreeRenderer {
    return ThreeRenderer.access.claim(new ThreeRenderer())
  }

  static get instance(): ThreeRenderer {
    return ThreeRenderer.access.get()
  }

  readonly kind = 'three'
  readonly canvas: HTMLCanvasElement
  private readonly webgl: THREE.WebGLRenderer
  private readonly layers: ThreeLayer[] = []

  private constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'three-canvas'
    this.webgl = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true })
    this.webgl.autoClear = false
    this.webgl.setClearColor(0x000000, 0)
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.canvas)
  }

  register(layer: ThreeLayer): void {
    this.layers.push(layer)
  }

  unregister(layer: ThreeLayer): void {
    const index = this.layers.indexOf(layer)
    if (index !== -1) this.layers.splice(index, 1)
  }

  render(): void {
    this.webgl.clear()
    const orderedVisible = this.layers
      .filter((layer) => layer.visible.value)
      .sort((first, second) => first.zIndex.value - second.zIndex.value)
    for (const layer of orderedVisible) {
      this.webgl.clearDepth()
      this.webgl.render(layer.scene, layer.camera)
    }
  }

  resize(viewport: Viewport): void {
    this.webgl.setPixelRatio(Math.min(viewport.devicePixelRatio, 2))
    this.webgl.setSize(viewport.width, viewport.height, false)
  }

  dispose(): void {
    this.webgl.dispose()
    this.canvas.remove()
    ThreeRenderer.access.clear()
  }
}
