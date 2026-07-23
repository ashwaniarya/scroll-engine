import gsap from 'gsap'
import { Layer } from '../layers/layer'
import { Prop } from './prop'
import type { LayerRenderer, Viewport } from './renderer'
import { ScrollController } from './scrollController'
import { singletonAccess } from './singleton'

export interface EngineOptions {
  stage: HTMLElement
  spacer: HTMLElement
  screens: number
}

class RootLayer extends Layer {
  readonly rendererKind = 'root'
}

function currentViewport(): Viewport {
  return {
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
    devicePixelRatio: window.devicePixelRatio || 1,
  }
}

export class Engine {
  private static readonly access = singletonAccess<Engine>('Engine')

  static create(options: EngineOptions): Engine {
    return Engine.access.claim(new Engine(options))
  }

  static get instance(): Engine {
    return Engine.access.get()
  }

  readonly scroll: ScrollController
  readonly root: Layer
  readonly fps = new Prop(0)
  readonly viewport: Prop<Viewport>

  private readonly stage: HTMLElement
  private readonly renderers = new Map<string, LayerRenderer>()
  private running = false
  private fpsFrameCount = 0
  private fpsElapsedSeconds = 0

  private constructor(options: EngineOptions) {
    this.stage = options.stage
    this.scroll = ScrollController.create(options.spacer)
    this.scroll.setTotalScreens(options.screens)
    this.root = new RootLayer('root')
    this.viewport = new Prop(currentViewport())
    this.scroll.smoothProgress.subscribe(() => {
      this.root.notifyScroll(this.scroll.snapshot())
    })
    this.viewport.subscribe((viewport) => {
      for (const renderer of this.renderers.values()) renderer.resize(viewport)
      this.root.resize(viewport)
    })
    window.addEventListener('resize', this.handleResize)
  }

  addRenderer(renderer: LayerRenderer): void {
    this.renderers.set(renderer.kind, renderer)
    renderer.mount(this.stage)
    renderer.resize(this.viewport.value)
  }

  addLayer(layer: Layer): void {
    if (!this.renderers.has(layer.rendererKind)) {
      throw new Error(`No renderer registered for kind "${layer.rendererKind}"`)
    }
    this.root.addChild(layer)
    layer.resize(this.viewport.value)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.root.init({ scroll: this.scroll, viewport: this.viewport })
    this.root.resize(this.viewport.value)
    this.root.notifyScroll(this.scroll.snapshot())
    gsap.ticker.add(this.tick)
  }

  stop(): void {
    if (!this.running) return
    this.running = false
    gsap.ticker.remove(this.tick)
  }

  dispose(): void {
    this.stop()
    window.removeEventListener('resize', this.handleResize)
    this.root.dispose()
    for (const renderer of this.renderers.values()) renderer.dispose()
    this.renderers.clear()
    this.scroll.dispose()
    Engine.access.clear()
  }

  private readonly tick = (_time: number, deltaMs: number): void => {
    const deltaSeconds = Math.min(deltaMs / 1000, 0.1)
    this.scroll.update(deltaSeconds)
    this.root.update(deltaSeconds)
    for (const renderer of this.renderers.values()) renderer.render(deltaSeconds)
    this.accumulateFps(deltaSeconds)
  }

  private readonly handleResize = (): void => {
    this.viewport.value = currentViewport()
  }

  private accumulateFps(deltaSeconds: number): void {
    this.fpsFrameCount += 1
    this.fpsElapsedSeconds += deltaSeconds
    if (this.fpsElapsedSeconds >= 0.5) {
      this.fps.value = Math.round(this.fpsFrameCount / this.fpsElapsedSeconds)
      this.fpsFrameCount = 0
      this.fpsElapsedSeconds = 0
    }
  }
}
