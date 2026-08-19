import gsap from 'gsap'
import * as THREE from 'three'
import type { ScrollState } from '../core/scrollController'
import { ThreeLayer } from '../layers/threeLayer'

const BACKGROUND_COLOR = 0x0b0d12

class TorusKnotLayer extends ThreeLayer {
  private knot!: THREE.Mesh

  constructor() {
    super('torus-knot')
    this.scrollRange = { start: 0, end: 0.55 }
  }

  protected override onInit(): void {
    super.onInit()
    this.scene.fog = new THREE.Fog(BACKGROUND_COLOR, 9, 34)
    this.knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.6, 0.45, 260, 36),
      new THREE.MeshStandardMaterial({
        color: 0xff6b57,
        roughness: 0.28,
        metalness: 0.32,
        emissive: 0xff6b57,
        emissiveIntensity: 0.12,
      }),
    )
    const wireframe = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.63, 0.47, 130, 18),
      new THREE.MeshBasicMaterial({ color: 0xffd9d2, wireframe: true, transparent: true, opacity: 0.1 }),
    )
    this.knot.add(wireframe)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6)
    keyLight.position.set(3, 4, 6)
    const rimLight = new THREE.DirectionalLight(0x2dd4bf, 1.8)
    rimLight.position.set(-5, -2, -4)
    this.scene.add(this.knot, keyLight, rimLight, new THREE.AmbientLight(0x8899ff, 0.5))

    // start further back so the hero copy has clean space, then dive in with a roll
    this.camera.position.set(0, 0, 13.5)
    this.scrub(
      gsap
        .timeline({ paused: true })
        .to(this.camera.position, { z: 4.2, x: 1.8, y: 1.2, ease: 'power2.inOut', duration: 1 }, 0)
        .to(this.camera.rotation, { z: -0.14, ease: 'power1.inOut', duration: 1 }, 0)
        .to(this.knot.rotation, { y: Math.PI * 2.4, ease: 'none', duration: 1 }, 0),
    )
  }

  protected override onScroll(scroll: ScrollState): void {
    const local = this.localProgress(scroll)
    this.opacity.value = local > 0.8 ? 1 - (local - 0.8) / 0.2 : 1
  }

  protected override onUpdate(deltaSeconds: number): void {
    this.knot.rotation.x += deltaSeconds * 0.3
  }
}

class IcosahedronFieldLayer extends ThreeLayer {
  private readonly field = new THREE.Group()

  constructor() {
    super('icosahedron-field')
    this.scrollRange = { start: 0.45, end: 1 }
  }

  protected override onInit(): void {
    super.onInit()
    this.scene.fog = new THREE.Fog(BACKGROUND_COLOR, 10, 38)
    const geometry = new THREE.IcosahedronGeometry(0.7)
    const material = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      roughness: 0.3,
      metalness: 0.35,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.1,
    })
    for (let index = 0; index < 34; index += 1) {
      const icosahedron = new THREE.Mesh(geometry, material)
      icosahedron.position.set(
        (Math.random() - 0.5) * 17,
        (Math.random() - 0.5) * 11,
        (Math.random() - 0.5) * 13,
      )
      icosahedron.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      icosahedron.scale.setScalar(0.35 + Math.random() * 1.2)
      this.field.add(icosahedron)
    }
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(-4, 5, 5)
    const rimLight = new THREE.DirectionalLight(0xff6b57, 1.4)
    rimLight.position.set(6, -3, -2)
    this.scene.add(this.field, keyLight, rimLight, new THREE.AmbientLight(0x66ffe0, 0.45))

    this.camera.position.set(0, 0, 20)
    this.scrub(
      gsap
        .timeline({ paused: true })
        .to(this.camera.position, { z: 7, x: -1.4, ease: 'power2.inOut', duration: 1 }, 0)
        .to(this.camera.rotation, { z: 0.1, ease: 'power1.inOut', duration: 1 }, 0)
        .to(this.field.rotation, { y: 1.4, ease: 'none', duration: 1 }, 0),
    )
  }

  protected override onScroll(scroll: ScrollState): void {
    const local = this.localProgress(scroll)
    this.opacity.value = local < 0.2 ? local / 0.2 : 1
  }

  protected override onUpdate(deltaSeconds: number): void {
    for (const icosahedron of this.field.children) {
      icosahedron.rotation.x += deltaSeconds * 0.22
      icosahedron.rotation.y += deltaSeconds * 0.14
    }
  }
}

export function createDemoThreeLayers(): ThreeLayer[] {
  return [new TorusKnotLayer(), new IcosahedronFieldLayer()]
}
