import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { derived, Prop, type ReadonlyProp } from './prop'
import { clamp01, damp, directionOf } from './scrollMath'
import { singletonAccess } from './singleton'

export interface ScrollState {
  rawProgress: number
  smoothProgress: number
  velocity: number
  direction: -1 | 0 | 1
}

const VELOCITY_DEADZONE = 0.005
const SETTLE_EPSILON = 0.0001

export class ScrollController {
  private static readonly access = singletonAccess<ScrollController>('ScrollController')

  static create(spacer: HTMLElement): ScrollController {
    return ScrollController.access.claim(new ScrollController(spacer))
  }

  static get instance(): ScrollController {
    return ScrollController.access.get()
  }

  readonly rawProgress = new Prop(0)
  readonly smoothProgress = new Prop(0)
  readonly velocity = new Prop(0)
  readonly direction: ReadonlyProp<-1 | 0 | 1>
  readonly smoothing = new Prop(6)

  private readonly spacer: HTMLElement
  private readonly trigger: ScrollTrigger
  private syncedToInitialScroll = false

  private constructor(spacer: HTMLElement) {
    this.spacer = spacer
    gsap.registerPlugin(ScrollTrigger)
    this.direction = derived([this.velocity], () =>
      directionOf(this.velocity.value, VELOCITY_DEADZONE),
    )
    this.trigger = ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      onUpdate: (self) => {
        this.rawProgress.value = self.progress
      },
    })
    this.rawProgress.value = this.trigger.progress
  }

  setTotalScreens(count: number): void {
    this.spacer.style.height = `${count * 100}vh`
    ScrollTrigger.refresh()
  }

  update(deltaSeconds: number): void {
    if (!this.syncedToInitialScroll) {
      this.syncedToInitialScroll = true
      this.smoothProgress.value = this.rawProgress.value
      return
    }
    const maxScroll = Math.max(1, ScrollTrigger.maxScroll(window))
    this.velocity.value = this.trigger.getVelocity() / maxScroll
    const target = this.rawProgress.value
    let next = damp(this.smoothProgress.value, target, this.smoothing.value, deltaSeconds)
    if (Math.abs(next - target) < SETTLE_EPSILON) next = target
    this.smoothProgress.value = clamp01(next)
  }

  snapshot(): ScrollState {
    return {
      rawProgress: this.rawProgress.value,
      smoothProgress: this.smoothProgress.value,
      velocity: this.velocity.value,
      direction: this.direction.value,
    }
  }

  dispose(): void {
    this.trigger.kill()
    ScrollController.access.clear()
  }
}
