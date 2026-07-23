import { describe, expect, it, vi } from 'vitest'
import { Prop } from '../core/prop'
import type { ScrollState } from '../core/scrollController'
import { singletonAccess } from '../core/singleton'
import { Layer, type EngineContext } from './layer'

class RecordingLayer extends Layer {
  readonly rendererKind = 'test'
  contextAtInit: EngineContext | null = null

  constructor(
    name: string,
    private readonly log: string[] = [],
  ) {
    super(name)
  }

  track(unsubscribe: () => void): void {
    this.trackSubscription(unsubscribe)
  }

  readLocalProgress(scroll: ScrollState): number {
    return this.localProgress(scroll)
  }

  protected override onInit(): void {
    this.log.push(`init:${this.name}`)
    this.contextAtInit = this.engineContext
  }

  protected override onScroll(): void {
    this.log.push(`scroll:${this.name}`)
  }

  protected override onUpdate(): void {
    this.log.push(`update:${this.name}`)
  }

  protected override onDispose(): void {
    this.log.push(`dispose:${this.name}`)
  }
}

function fakeContext(): EngineContext {
  const smoothProgress = new Prop(0)
  return {
    scroll: {
      smoothProgress,
      snapshot: () => scrollState(smoothProgress.value),
    },
    viewport: new Prop({ width: 1920, height: 1080, devicePixelRatio: 1 }),
  }
}

function scrollState(progress: number): ScrollState {
  return { rawProgress: progress, smoothProgress: progress, velocity: 0, direction: 0 }
}

describe('Layer tree', () => {
  it('cascades init to children with the same context', () => {
    const log: string[] = []
    const parent = new RecordingLayer('parent', log)
    const child = new RecordingLayer('child', log)
    parent.addChild(child)
    const context = fakeContext()
    parent.init(context)
    expect(log).toEqual(['init:parent', 'init:child'])
    expect(child.contextAtInit).toBe(context)
  })

  it('notifies every visible layer in one synchronous pass', () => {
    const log: string[] = []
    const parent = new RecordingLayer('parent', log)
    const childA = new RecordingLayer('childA', log)
    const childB = new RecordingLayer('childB', log)
    parent.addChild(childA)
    parent.addChild(childB)
    parent.init(fakeContext())
    log.length = 0
    parent.notifyScroll(scrollState(0.5))
    expect(log).toEqual(['scroll:parent', 'scroll:childA', 'scroll:childB'])
  })

  it('skips an invisible layer and its whole subtree', () => {
    const log: string[] = []
    const parent = new RecordingLayer('parent', log)
    const child = new RecordingLayer('child', log)
    const grandchild = new RecordingLayer('grandchild', log)
    parent.addChild(child)
    child.addChild(grandchild)
    parent.init(fakeContext())
    log.length = 0
    child.visible.value = false
    parent.notifyScroll(scrollState(0.5))
    expect(log).toEqual(['scroll:parent'])
  })

  it('initializes a child added after the parent was initialized', () => {
    const log: string[] = []
    const parent = new RecordingLayer('parent', log)
    parent.init(fakeContext())
    const lateChild = new RecordingLayer('late', log)
    parent.addChild(lateChild)
    expect(log).toContain('init:late')
    expect(lateChild.contextAtInit).not.toBeNull()
  })

  it('disposes children before the parent and releases tracked subscriptions', () => {
    const log: string[] = []
    const parent = new RecordingLayer('parent', log)
    const child = new RecordingLayer('child', log)
    parent.addChild(child)
    parent.init(fakeContext())
    const watched = new Prop(0)
    const listener = vi.fn()
    parent.track(watched.subscribe(listener))
    log.length = 0
    parent.dispose()
    expect(log).toEqual(['dispose:child', 'dispose:parent'])
    watched.value = 1
    expect(listener).not.toHaveBeenCalled()
  })

  it('skips update for a fully faded subtree but still delivers scroll', () => {
    const log: string[] = []
    const parent = new RecordingLayer('parent', log)
    const child = new RecordingLayer('child', log)
    parent.addChild(child)
    parent.init(fakeContext())
    log.length = 0
    child.opacity.value = 0
    parent.update(0.016)
    parent.notifyScroll(scrollState(0.5))
    expect(log).toEqual(['update:parent', 'scroll:parent', 'scroll:child'])
  })

  it('reports isRenderable from visible and opacity together', () => {
    const layer = new RecordingLayer('gauge')
    expect(layer.isRenderable).toBe(true)
    layer.opacity.value = 0.0005
    expect(layer.isRenderable).toBe(false)
    layer.opacity.value = 0.5
    layer.visible.value = false
    expect(layer.isRenderable).toBe(false)
    layer.visible.value = true
    expect(layer.isRenderable).toBe(true)
  })

  it('remaps global progress into the layer scroll range', () => {
    const layer = new RecordingLayer('ranged')
    layer.scrollRange = { start: 0.25, end: 0.75 }
    expect(layer.readLocalProgress(scrollState(0.1))).toBe(0)
    expect(layer.readLocalProgress(scrollState(0.5))).toBeCloseTo(0.5, 10)
    expect(layer.readLocalProgress(scrollState(0.9))).toBe(1)
  })

  it('drives scrubbed timelines from local progress and kills them on dispose', () => {
    const layer = new RecordingLayer('scrubbed')
    layer.scrollRange = { start: 0, end: 0.5 }
    const timeline = { progress: vi.fn(), kill: vi.fn() }
    layer.scrub(timeline)
    layer.init(fakeContext())
    layer.notifyScroll(scrollState(0.25))
    expect(timeline.progress).toHaveBeenLastCalledWith(0.5)
    layer.dispose()
    expect(timeline.kill).toHaveBeenCalledOnce()
  })
})

describe('singletonAccess', () => {
  it('throws when claimed twice', () => {
    const access = singletonAccess<object>('Widget')
    access.claim({})
    expect(() => access.claim({})).toThrow('Widget already created')
  })

  it('throws when read before create', () => {
    const access = singletonAccess<object>('Widget')
    expect(() => access.get()).toThrow('Widget.create() has not been called')
  })

  it('allows claiming again after clear', () => {
    const access = singletonAccess<object>('Widget')
    const first = access.claim({})
    access.clear()
    const second = access.claim({})
    expect(access.get()).toBe(second)
    expect(second).not.toBe(first)
  })
})
