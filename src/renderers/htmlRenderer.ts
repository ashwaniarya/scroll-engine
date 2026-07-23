import type { LayerRenderer, Viewport } from '../core/renderer'
import { singletonAccess } from '../core/singleton'

export class HtmlRenderer implements LayerRenderer {
  private static readonly access = singletonAccess<HtmlRenderer>('HtmlRenderer')

  static create(): HtmlRenderer {
    return HtmlRenderer.access.claim(new HtmlRenderer())
  }

  static get instance(): HtmlRenderer {
    return HtmlRenderer.access.get()
  }

  readonly kind = 'html'
  readonly root: HTMLElement

  private constructor() {
    this.root = document.createElement('div')
    this.root.id = 'html-root'
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.root)
  }

  render(): void {}

  resize(_viewport: Viewport): void {}

  dispose(): void {
    this.root.remove()
    HtmlRenderer.access.clear()
  }
}
