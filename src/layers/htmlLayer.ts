import type { ReadonlyProp } from '../core/prop'
import { HtmlRenderer } from '../renderers/htmlRenderer'
import { Layer } from './layer'

export class HtmlLayer extends Layer {
  readonly rendererKind = 'html'
  readonly element: HTMLElement

  constructor(name: string, element?: HTMLElement) {
    super(name)
    this.element = element ?? document.createElement('div')
  }

  bind<T>(prop: ReadonlyProp<T>, apply: (value: T, element: HTMLElement) => void): void {
    apply(prop.value, this.element)
    this.trackSubscription(prop.subscribe((value) => apply(value, this.element)))
  }

  protected override onInit(): void {
    const container = this.parent instanceof HtmlLayer ? this.parent.element : HtmlRenderer.instance.root
    container.appendChild(this.element)
    // subscribe-only (no initial write): scrubbed timelines own these styles until the prop actually changes
    this.trackSubscription(
      this.opacity.subscribe((value) => {
        this.element.style.opacity = String(value)
      }),
    )
    this.trackSubscription(
      this.visible.subscribe((value) => {
        this.element.style.visibility = value ? 'visible' : 'hidden'
      }),
    )
    this.trackSubscription(
      this.zIndex.subscribe((value) => {
        this.element.style.zIndex = String(value)
      }),
    )
  }

  protected override onDispose(): void {
    this.element.remove()
  }
}
