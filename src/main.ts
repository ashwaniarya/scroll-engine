import './style.css'
import { Engine } from './core/engine'
import { createDemoHtmlLayers } from './demo/demoHtmlSections'
import { createDemoThreeLayers } from './demo/demoThreeLayers'
import { DevPanel } from './dev/devPanel'
import { HtmlRenderer } from './renderers/htmlRenderer'
import { ThreeRenderer } from './renderers/threeRenderer'

function requireElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector)
  if (!element) throw new Error(`Missing element: ${selector}`)
  return element
}

const engine = Engine.create({
  stage: requireElement('#layer-stage'),
  spacer: requireElement('#scroll-spacer'),
  screens: 5,
})

engine.addRenderer(ThreeRenderer.create())
engine.addRenderer(HtmlRenderer.create())

for (const layer of createDemoThreeLayers()) engine.addLayer(layer)
for (const layer of createDemoHtmlLayers()) engine.addLayer(layer)

engine.start()
DevPanel.create()
;(window as typeof window & { scrollEngine?: Engine }).scrollEngine = engine
