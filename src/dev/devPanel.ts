import { Pane } from 'tweakpane'
import { Engine } from '../core/engine'
import type { Prop, ReadonlyProp } from '../core/prop'
import { singletonAccess } from '../core/singleton'
import type { Layer } from '../layers/layer'

type Folder = ReturnType<Pane['addFolder']>
type BindingOptions = Parameters<Folder['addBinding']>[2]

export function bindPropToPane<T>(
  folder: Folder,
  prop: Prop<T>,
  label: string,
  options?: BindingOptions,
): void {
  const target: Record<string, unknown> = { [label]: prop.value }
  const binding = folder.addBinding(target, label, options)
  let syncingFromProp = false
  binding.on('change', (event) => {
    // refresh() can emit change when the pane clamps (min/step) — never echo that back mid-notify
    if (syncingFromProp) return
    prop.value = event.value as T
  })
  prop.subscribe((value) => {
    syncingFromProp = true
    try {
      target[label] = value
      binding.refresh()
    } finally {
      syncingFromProp = false
    }
  })
}

function monitorProp(
  folder: Folder,
  prop: ReadonlyProp<number>,
  label: string,
  options?: BindingOptions,
): void {
  const target: Record<string, number> = { [label]: prop.value }
  folder.addBinding(target, label, { interval: 50, ...options, readonly: true })
  prop.subscribe((value) => {
    target[label] = value
  })
}

export class DevPanel {
  private static readonly access = singletonAccess<DevPanel>('DevPanel')

  static create(): DevPanel {
    return DevPanel.access.claim(new DevPanel())
  }

  static get instance(): DevPanel {
    return DevPanel.access.get()
  }

  private readonly pane: Pane

  private constructor() {
    const engine = Engine.instance
    this.pane = new Pane({ title: 'scroll-engine' })
    this.pane.hidden = new URLSearchParams(window.location.search).get('dev') !== '1'
    this.pinToViewport()

    const scrollFolder = this.pane.addFolder({ title: 'scroll' })
    monitorProp(scrollFolder, engine.scroll.rawProgress, 'raw', { view: 'graph', min: 0, max: 1 })
    monitorProp(scrollFolder, engine.scroll.smoothProgress, 'smooth', { view: 'graph', min: 0, max: 1 })
    monitorProp(scrollFolder, engine.scroll.velocity, 'velocity', { view: 'graph', min: -2, max: 2 })
    monitorProp(scrollFolder, engine.scroll.direction, 'direction')
    bindPropToPane(scrollFolder, engine.scroll.smoothing, 'smoothing', { min: 1, max: 15 })

    const performanceFolder = this.pane.addFolder({ title: 'performance' })
    monitorProp(performanceFolder, engine.fps, 'fps', { view: 'graph', min: 0, max: 120 })

    for (const layer of engine.root.children) this.addLayerFolder(layer)

    window.addEventListener('keydown', this.handleKeydown)
  }

  toggle(): void {
    this.pane.hidden = !this.pane.hidden
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeydown)
    this.pane.dispose()
    DevPanel.access.clear()
  }

  // inline styles: tweakpane injects its own absolute-positioned stylesheet after ours
  private pinToViewport(): void {
    const container = this.pane.element.parentElement
    if (!container) return
    container.style.position = 'fixed'
    container.style.top = '8px'
    container.style.right = '8px'
    container.style.zIndex = '100'
    container.style.maxHeight = 'calc(100vh - 16px)'
    container.style.overflowY = 'auto'
  }

  private addLayerFolder(layer: Layer): void {
    const folder = this.pane.addFolder({ title: `layer · ${layer.name}`, expanded: false })
    bindPropToPane(folder, layer.visible, 'visible')
    bindPropToPane(folder, layer.opacity, 'opacity', { min: 0, max: 1 })
    bindPropToPane(folder, layer.zIndex, 'zIndex', { min: -10, max: 10, step: 1 })
    folder.addBinding(layer.scrollRange, 'start', { min: 0, max: 1 })
    folder.addBinding(layer.scrollRange, 'end', { min: 0, max: 1 })
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === '`') this.toggle()
  }
}
