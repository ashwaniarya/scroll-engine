import * as THREE from 'three'
import type { Viewport } from '../core/renderer'
import { ThreeRenderer } from '../renderers/threeRenderer'
import { Layer } from './layer'

export class ThreeLayer extends Layer {
  readonly rendererKind = 'three'
  readonly scene = new THREE.Scene()
  readonly camera: THREE.Camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300)

  protected override onInit(): void {
    ThreeRenderer.instance.register(this)
    this.trackSubscription(this.opacity.subscribe((value) => this.applyOpacityToMaterials(value)))
  }

  protected override onResize(viewport: Viewport): void {
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = viewport.width / viewport.height
      this.camera.updateProjectionMatrix()
    }
  }

  protected override onDispose(): void {
    ThreeRenderer.instance.unregister(this)
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        for (const material of this.materialsOf(object)) material.dispose()
      }
    })
  }

  protected applyOpacityToMaterials(value: number): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        for (const material of this.materialsOf(object)) {
          if (material.userData.baseOpacity === undefined) {
            material.userData.baseOpacity = material.opacity
          }
          material.transparent = true
          material.opacity = value * (material.userData.baseOpacity as number)
        }
      }
    })
  }

  private materialsOf(mesh: THREE.Mesh): THREE.Material[] {
    return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  }
}
