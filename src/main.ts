import './style.css'
import { Engine } from './core/engine'
import { createStage } from './core/stage'
import { createParticleFieldLayer } from './demo/demoBackground'
import { createDemoHtmlLayers } from './demo/demoHtmlSections'
import { createGrainVignetteLayer, createNebulaLayer } from './demo/demoShaders'
import { createDemoThreeLayers } from './demo/demoThreeLayers'
import { DevPanel } from './dev/devPanel'
import { HtmlRenderer } from './renderers/htmlRenderer'
import { ThreeRenderer } from './renderers/threeRenderer'

const engine = Engine.create({ ...createStage(), screens: 5 })

engine.addRenderer(ThreeRenderer.create())
engine.addRenderer(HtmlRenderer.create())

// back-to-front: nebula (-20) → particles (-10) → 3D subjects (0) → grain/vignette (20)
engine.addLayer(createNebulaLayer())
engine.addLayer(createParticleFieldLayer())
for (const layer of createDemoThreeLayers()) engine.addLayer(layer)
engine.addLayer(createGrainVignetteLayer())
for (const layer of createDemoHtmlLayers()) engine.addLayer(layer)

engine.start()
DevPanel.create()
;(window as typeof window & { scrollEngine?: Engine }).scrollEngine = engine
