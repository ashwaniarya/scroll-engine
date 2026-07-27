# scroll-engine

A TypeScript engine for scroll-driven 3D websites. Everything connects through subscribable properties; layers are independent renders composited in a stack.

![stack](https://img.shields.io/badge/three.js-r185-049EF4) ![gsap](https://img.shields.io/badge/GSAP-ScrollTrigger-88CE02) ![vite](https://img.shields.io/badge/Vite-8-646CFF)

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173/?dev=1
```

Press <kbd>`</kbd> (backtick) to toggle the dev panel. `?dev=1` opens it on load.

## Use as a library

```bash
npm install github:ashwaniarya/scroll-engine three gsap
```

The package builds itself on install (`prepare` script). `three`, `gsap`, and `tweakpane` are peer dependencies — npm 7+ installs them automatically.

```ts
import { createStage, DevPanel, Engine, HtmlRenderer, ThreeRenderer } from 'scroll-engine'

const engine = Engine.create({ ...createStage(), screens: 5 })
engine.addRenderer(ThreeRenderer.create())
engine.addRenderer(HtmlRenderer.create())
engine.addLayer(new MyLayer())        // your ThreeLayer / HtmlLayer subclasses
engine.start()
DevPanel.create()                     // optional; ?dev=1 or backtick to show

// createStage() appends the scroll spacer + fixed stage to <body>;
// all structural styles are inline. Bring your own `body { margin: 0 }`.
```

## Architecture

Two things happen in the engine, and they are easiest to read separately: **scroll data flowing left to right** (an event path — runs only when scroll changes), and the **frame loop** (runs every frame).

### 1 · Scroll data flow

```mermaid
flowchart LR
  subgraph INPUT["1 · Input"]
    direction TB
    SPACER["Tall spacer<br/>native scroll"] --> TRIGGER["GSAP<br/>ScrollTrigger"]
  end

  subgraph CORE["2 · ScrollController · Props"]
    direction TB
    RAW["rawProgress"] --> SMOOTH["smoothProgress<br/>damped lerp"]
    SMOOTH --> EXTRA["velocity<br/>direction"]
  end

  subgraph TREE["3 · Layer tree"]
    direction TB
    ROOT["root"] --> THREE_LAYER["ThreeLayer<br/>own scene + camera"]
    ROOT --> HTML_LAYER["HtmlLayer<br/>DOM element"]
    THREE_LAYER --> LOCAL["scrollRange maps global → local 0..1<br/>local progress scrubs paused GSAP timelines"]
    HTML_LAYER --> LOCAL
  end

  subgraph OUTPUT["4 · Composited output"]
    direction TB
    THREE_RENDERER["ThreeRenderer<br/>one canvas · zIndex order<br/>depth-cleared between layers"]
    HTML_RENDERER["HtmlRenderer<br/>#html-root overlay"]
  end

  TRIGGER -- "onUpdate" --> RAW
  SMOOTH -- "notifyScroll<br/>one sync pass" --> ROOT
  THREE_LAYER -. "registers with" .-> THREE_RENDERER
  HTML_LAYER -. "mounts into" .-> HTML_RENDERER
```

Renderers are **pluggable**: `LayerRenderer` is an interface, and each layer names its backend via `rendererKind`. New render tech (Canvas2D, CSS3D, …) plugs in without touching the engine.

### 2 · Frame loop (`gsap.ticker`)

```mermaid
flowchart LR
  TICK["Engine.tick"] --> DAMP["scroll.update<br/>damp raw → smooth"] --> UPDATE["root.update<br/>skips culled subtrees"] --> RENDER["renderers.render<br/>draws only isRenderable layers<br/>visible && opacity > ε"] --> FPS["fps Prop"]
```

Fully faded layers cost nothing per frame — they are culled from both `update()` and the draw list, but keep receiving `notifyScroll` so they can fade themselves back in. All shaders are precompiled on the first frame, so a culled layer's reveal never stutters.

### 3 · Observability

```mermaid
flowchart LR
  DEV["DevPanel · Tweakpane"] <-- "two-way Prop bindings" --> PROPS["scroll graphs · fps · smoothing<br/>per-layer visible / opacity / zIndex / range"]
```

### Core concepts

- **`Prop<T>`** (`src/core/prop.ts`) — reactive property: synchronous notify on change, `Object.is` equality gate, re-entrancy guard, `derived()` for computed props. Every value in the system is a Prop.
- **`Layer`** (`src/layers/layer.ts`) — renders through a pluggable backend. Layers form a tree; children inherit the parent context. Each layer has `visible` / `opacity` / `zIndex` Props and a `scrollRange` that remaps global scroll progress to a local 0..1.
- **`LayerRenderer`** (`src/core/renderer.ts`) — the plugin interface. `ThreeRenderer` composites every `ThreeLayer` (each with its **own scene and camera**) sequentially on one WebGL canvas, ordered by `zIndex`, depth-cleared between layers. `HtmlRenderer` hosts DOM layers in a fixed overlay. New render tech (Canvas2D, CSS3D, …) = implement the interface; the engine is untouched.
- **`ScrollController`** (`src/core/scrollController.ts`) — one full-page ScrollTrigger writes `rawProgress`; a framerate-independent lerp produces `smoothProgress`; `velocity` and `direction` come along. One synchronous pass notifies every active layer per change.
- **Scrubbed timelines** — layers build paused GSAP timelines; `layer.scrub(timeline)` drives them from the layer's local progress.
- **Singletons** — `Engine`, `ScrollController`, renderers, and `DevPanel` use `create()` / `.instance` / `dispose()`.
- **`DevPanel`** (`src/dev/devPanel.ts`) — Tweakpane bound two-way to the Props: scroll graphs, FPS, smoothing, and a folder per layer.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm test` | Vitest unit + behavioural tests |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run build` | typecheck + production build |

## Writing a layer

```ts
class MyLayer extends ThreeLayer {
  constructor() {
    super('my-layer')
    this.scrollRange = { start: 0.2, end: 0.6 }
  }

  protected override onInit(): void {
    super.onInit()
    // build this.scene, position this.camera…
    this.scrub(gsap.timeline({ paused: true }).to(this.camera.position, { z: 4, duration: 1 }))
  }

  protected override onScroll(scroll: ScrollState): void {
    this.opacity.value = this.localProgress(scroll)
  }
}

Engine.instance.addLayer(new MyLayer())
```
