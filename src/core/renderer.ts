export interface Viewport {
  width: number
  height: number
  devicePixelRatio: number
}

export interface LayerRenderer {
  readonly kind: string
  mount(container: HTMLElement): void
  render(deltaSeconds: number): void
  resize(viewport: Viewport): void
  dispose(): void
}
