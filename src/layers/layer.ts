import { Prop, type ReadonlyProp, type Unsubscribe } from '../core/prop'
import type { Viewport } from '../core/renderer'
import type { ScrollState } from '../core/scrollController'
import { remapProgress } from '../core/scrollMath'

export interface ScrollSource {
  readonly smoothProgress: ReadonlyProp<number>
  snapshot(): ScrollState
}

export interface EngineContext {
  scroll: ScrollSource
  viewport: ReadonlyProp<Viewport>
}

export interface ScrubTimeline {
  progress(value: number): unknown
  kill(): void
}

export abstract class Layer {
  readonly name: string
  readonly visible = new Prop(true)
  readonly opacity = new Prop(1)
  readonly zIndex = new Prop(0)
  scrollRange = { start: 0, end: 1 }
  readonly children: Layer[] = []
  parent: Layer | null = null
  abstract readonly rendererKind: string

  private context: EngineContext | null = null
  private readonly subscriptions: Unsubscribe[] = []
  private readonly timelines: ScrubTimeline[] = []

  constructor(name: string) {
    this.name = name
  }

  protected get engineContext(): EngineContext {
    if (!this.context) throw new Error(`Layer "${this.name}" is not initialized`)
    return this.context
  }

  addChild(child: Layer): void {
    child.parent = this
    this.children.push(child)
    if (this.context) child.init(this.context)
  }

  removeChild(child: Layer): void {
    const index = this.children.indexOf(child)
    if (index === -1) return
    this.children.splice(index, 1)
    child.parent = null
    child.dispose()
  }

  init(context: EngineContext): void {
    this.context = context
    this.onInit()
    for (const child of this.children) child.init(context)
  }

  notifyScroll(scroll: ScrollState): void {
    if (!this.visible.value) return
    this.onScroll(scroll)
    const local = this.localProgress(scroll)
    for (const timeline of this.timelines) timeline.progress(local)
    for (const child of [...this.children]) child.notifyScroll(scroll)
  }

  update(deltaSeconds: number): void {
    if (!this.visible.value) return
    this.onUpdate(deltaSeconds)
    for (const child of this.children) child.update(deltaSeconds)
  }

  resize(viewport: Viewport): void {
    this.onResize(viewport)
    for (const child of this.children) child.resize(viewport)
  }

  dispose(): void {
    for (const child of [...this.children]) child.dispose()
    this.children.length = 0
    this.onDispose()
    for (const timeline of this.timelines) timeline.kill()
    this.timelines.length = 0
    for (const unsubscribe of this.subscriptions) unsubscribe()
    this.subscriptions.length = 0
    this.context = null
  }

  scrub(timeline: ScrubTimeline): void {
    this.timelines.push(timeline)
    if (this.context) timeline.progress(this.localProgress(this.context.scroll.snapshot()))
  }

  protected localProgress(scroll: ScrollState): number {
    return remapProgress(scroll.smoothProgress, this.scrollRange.start, this.scrollRange.end)
  }

  protected trackSubscription(unsubscribe: Unsubscribe): void {
    this.subscriptions.push(unsubscribe)
  }

  protected onInit(): void {}
  protected onScroll(_scroll: ScrollState): void {}
  protected onUpdate(_deltaSeconds: number): void {}
  protected onResize(_viewport: Viewport): void {}
  protected onDispose(): void {}
}
