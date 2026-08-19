import gsap from 'gsap'
import * as THREE from 'three'
import { ThreeLayer } from '../layers/threeLayer'

const PARTICLE_COUNT = 700

class ParticleFieldLayer extends ThreeLayer {
  private points!: THREE.Points

  constructor() {
    super('particles')
    this.scrollRange = { start: 0, end: 1 }
    this.zIndex.value = -10
  }

  protected override onInit(): void {
    super.onInit()

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const scales = new Float32Array(PARTICLE_COUNT)
    const coral = new THREE.Color(0xff6b57)
    const teal = new THREE.Color(0x2dd4bf)
    const white = new THREE.Color(0xf4f7ff)

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 46
      positions[index * 3 + 1] = (Math.random() - 0.5) * 28
      positions[index * 3 + 2] = (Math.random() - 0.5) * 34 - 4
      const pick = Math.random()
      const color = pick < 0.62 ? white : pick < 0.85 ? coral : teal
      colors[index * 3] = color.r
      colors[index * 3 + 1] = color.g
      colors[index * 3 + 2] = color.b
      scales[index] = 0.4 + Math.random() * 1.2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))

    const material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    this.points = new THREE.Points(geometry, material)
    this.scene.add(this.points)
    this.camera.position.set(0, 0, 18)

    // slow parallax dive + drift across the whole scroll
    this.scrub(
      gsap
        .timeline({ paused: true })
        .to(this.camera.position, { z: 9, ease: 'none', duration: 1 }, 0)
        .to(this.points.rotation, { y: 0.6, ease: 'none', duration: 1 }, 0),
    )
  }

  protected override onUpdate(deltaSeconds: number): void {
    this.points.rotation.y += deltaSeconds * 0.012
    this.points.rotation.x += deltaSeconds * 0.004
  }
}

export function createParticleFieldLayer(): ThreeLayer {
  return new ParticleFieldLayer()
}
