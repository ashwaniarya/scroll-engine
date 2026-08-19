# scroll-engine Public Page + TRINETRA Deploy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Humanize scroll-engine's demo copy, deploy it publicly at `scroll-engine.syncoderslabs.com`, deploy TRINETRA at `trinetra.syncoderslabs.com`, and wire both into syncoderslabs.com.

**Architecture:** scroll-engine's demo content lives in one shared file (`src/demo/demoHtmlSections.ts`) used by both `npm run dev` and the deployed `npm run build:demo` output — editing it improves both. Both sites are Vite/TypeScript static builds served on isolated Railway projects (one project per site, verified isolated before any deploy), each with its own subdomain CNAME the user adds at their registrar.

**Tech Stack:** TypeScript, Vite 8, Three.js r185, GSAP ScrollTrigger, Railway (Railpack builder), `serve` for static file serving.

**Testing approach:** No unit-test surface is added (the engine's existing `*.test.ts` core-logic tests are untouched). Both deliverables are interactive WebGL scroll experiences — verification is browser-based smoke testing (page loads, canvas renders, scroll drives layer transitions, zero console errors, links resolve), consistent with the syncoderslabs.com build in this session.

**Git note:** scroll-engine and trinetra are both on `main`, protected by a global PreToolUse hook that blocks direct main manipulation. Commits to main in these repos require the `ALLOW_MAIN=1` prefix (established pattern this session). This plan uses short-lived feature branches for the code/config changes, then fast-forward merges to main with `ALLOW_MAIN=1`, mirroring the syncoderslabs.com flow.

**Deploy note:** Railway's current builder is Railpack. `railway up` uploads the local working tree directly (no GitHub push required for deploy — same as the syncoderslabs.com deploy). The exact static-serve config is treated empirically: each deploy task inspects build logs and the live response, with a concrete first attempt and a documented fallback.

---

## File Structure

```
scroll-engine/
  src/demo/demoHtmlSections.ts   MODIFY  hero lede sentence + new outro/CTA layer
  src/style.css                  MODIFY  .hero-lede + .outro styles
  railway.json                   CREATE  build:demo + serve start command
  package.json                   MODIFY  add "serve" devDependency

trinetra/
  railway.json                   CREATE  build + serve start command
  package.json                   MODIFY  add "serve" dependency

syncoderslabs/
  js/products-data.js            MODIFY  scroll-engine card url: '#' -> live subdomain
```

---

### Task 1: Humanize scroll-engine demo copy (hero lede + outro/CTA)

**Files:**
- Modify: `/Users/arya/p/scroll-engine/src/demo/demoHtmlSections.ts`
- Modify: `/Users/arya/p/scroll-engine/src/style.css`

- [ ] **Step 1: Create the feature branch**

```bash
cd /Users/arya/p/scroll-engine
git checkout -b feat/public-demo-page
git branch --show-current   # expect: feat/public-demo-page
```

- [ ] **Step 2: Add the hero lede sentence**

In `src/demo/demoHtmlSections.ts`, the `createHeroLayer` function currently sets this HTML:

```
`<h1>scroll-engine</h1>
     <p>layered renders · one scroll · live props</p>
     <span class="scroll-hint">scroll</span>`
```

Replace that template string (the second argument to `sectionElement`) with:

```
`<h1>scroll-engine</h1>
     <p>layered renders · one scroll · live props</p>
     <p class="hero-lede">A TypeScript engine for scroll-driven 3D sites. Independent layers — Three.js scenes and HTML — stay in sync through one scroll signal.</p>
     <span class="scroll-hint">scroll</span>`
```

- [ ] **Step 3: Add the outro/CTA layer function**

In the same file, add this new function immediately **after** `createCaptionLayer` (before `createDemoHtmlLayers`). It fades in over the first 40% of its scroll range, then holds visible to the end (the trailing `.to(..., { autoAlpha: 1, duration: 0.6 })` pads the timeline to total duration 1.0 so `timeline.progress(local)` holds the end state — matching how the existing captions build duration-1.0 timelines):

```ts
function createOutroLayer(): HtmlLayer {
  const element = sectionElement(
    'outro',
    `<h2>Build your own</h2>
     <p>Everything you just scrolled through is a handful of layers and one scroll signal. Drop the engine into any Vite + TypeScript project.</p>
     <code>npm install github:ashwaniarya/scroll-engine three gsap</code>
     <div class="outro-links">
       <a href="https://github.com/ashwaniarya/scroll-engine">GitHub repo →</a>
       <a href="https://trinetra.syncoderslabs.com">Built with this: TRINETRA →</a>
     </div>`,
  )
  const outro = new HtmlLayer('outro', element)
  outro.scrollRange = { start: 0.85, end: 1 }
  outro.scrub(
    gsap
      .timeline({ paused: true })
      .fromTo(
        element,
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      )
      .to(element, { autoAlpha: 1, duration: 0.6 }),
  )
  return outro
}
```

- [ ] **Step 4: Register the outro layer in the layer list**

In `createDemoHtmlLayers`, the current `return` array ends with the `createCaptionLayer('caption-field', ...)` entry. Add `createOutroLayer()` as the final array element. The full function becomes:

```ts
export function createDemoHtmlLayers(): HtmlLayer[] {
  return [
    createHeroLayer(),
    createCaptionLayer(
      'caption-torus',
      'Independent renders',
      'This torus knot is a ThreeLayer with its own scene and camera. The camera dolly you see is a GSAP timeline scrubbed by this layer’s local scroll range.',
      0.12,
      0.5,
    ),
    createCaptionLayer(
      'caption-field',
      'One scroll, many subscribers',
      'A second ThreeLayer crossfades in on the same canvas while this caption animates in the HTML layer — every property subscribes to the same scroll.',
      0.52,
      0.95,
    ),
    createOutroLayer(),
  ]
}
```

- [ ] **Step 5: Add CSS for the hero lede and outro**

Append to `src/style.css` (after the existing `.caption p` block at the end of the file):

```css
.hero .hero-lede {
  max-width: 32rem;
  font-size: 1rem;
  color: #6b7386;
  line-height: 1.5;
}

.outro {
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

.outro h2 {
  font-size: clamp(1.8rem, 4vw, 3rem);
  letter-spacing: -0.02em;
}

.outro p {
  max-width: 30rem;
  color: #9aa3b8;
  line-height: 1.5;
}

.outro code {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.6rem 1rem;
  background: #151922;
  border: 1px solid #262c3a;
  border-radius: 8px;
  color: #e8eaf2;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.9rem;
}

.outro-links {
  margin-top: 1.5rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.outro-links a {
  color: #2dd4bf;
  text-decoration: none;
  font-size: 0.95rem;
}

.outro-links a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 6: Typecheck**

Run: `cd /Users/arya/p/scroll-engine && npm run typecheck`
Expected: no errors (exit 0). `gsap`, `HtmlLayer`, and `sectionElement` are already imported/defined in the file; the new function uses only those.

- [ ] **Step 7: Commit**

```bash
cd /Users/arya/p/scroll-engine
git add src/demo/demoHtmlSections.ts src/style.css
git commit -m "feat: humanize demo — hero lede + outro CTA"
```

---

### Task 2: Local browser verification of the updated demo

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Use `mcp__Claude_Browser__preview_start` with `{name: "scroll-engine"}` (the repo's `.claude/launch.json` defines a `scroll-engine` server on port 5174 per project memory; if `preview_start` reports the name is missing, instead run `cd /Users/arya/p/scroll-engine && npm run dev` via Bash in the background — Vite serves on `http://localhost:5173` — then `mcp__Claude_Browser__navigate` there).

- [ ] **Step 2: Verify hero + no console errors at scroll top**

- `mcp__Claude_Browser__read_page` → confirm the hero shows the new lede sentence ("A TypeScript engine for scroll-driven 3D sites…").
- `mcp__Claude_Browser__read_console_messages` → expect zero errors (WebGL context warnings, if any, are not errors).
- `mcp__Claude_Browser__computer` screenshot → confirm the 3D torus knot renders (canvas is not blank).

- [ ] **Step 3: Verify the outro appears at the end of scroll**

Drive scroll to the end and confirm the outro renders. Because the Browser pane suspends scroll animation during tool-driven interaction (documented quirk this session), verify via the DOM + a direct scroll rather than trusting a visual scroll animation:

```js
// via mcp__Claude_Browser__javascript_tool
(function(){
  const outro = document.querySelector('.outro');
  return JSON.stringify({
    outroExists: !!outro,
    hasInstallSnippet: outro ? outro.querySelector('code').textContent.includes('github:ashwaniarya/scroll-engine') : null,
    githubLink: outro ? outro.querySelector('.outro-links a[href*="github.com"]').getAttribute('href') : null,
    trinetraLink: outro ? outro.querySelector('.outro-links a[href*="trinetra"]').getAttribute('href') : null
  });
})()
```

Expected: `outroExists: true`, `hasInstallSnippet: true`, `githubLink: "https://github.com/ashwaniarya/scroll-engine"`, `trinetraLink: "https://trinetra.syncoderslabs.com"`.

- [ ] **Step 4: Stop the dev server**

`mcp__Claude_Browser__preview_stop` (or kill the background `npm run dev` process). No commit — verification only.

---

### Task 3: Add Railway deploy config to scroll-engine

**Files:**
- Create: `/Users/arya/p/scroll-engine/railway.json`
- Modify: `/Users/arya/p/scroll-engine/package.json`

- [ ] **Step 1: Create `railway.json`**

`npm run build` in this repo builds the **library** (`build:lib`), not the demo site — so the build command must be set explicitly to `build:demo`, which outputs the static site to `dist-demo/`.

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "buildCommand": "npm run build:demo"
  },
  "deploy": {
    "startCommand": "npx serve dist-demo -s -l $PORT"
  }
}
```

- [ ] **Step 2: Add `serve` as a devDependency**

`serve` must be installed at build time so `npx serve` resolves the local install (no runtime network fetch). It goes in `devDependencies` (not `dependencies`) because scroll-engine is a published library — its `files: ["dist"]` whitelist and runtime consumers must not inherit `serve`.

In `/Users/arya/p/scroll-engine/package.json`, the current `devDependencies` block is:

```json
  "devDependencies": {
    "@types/three": "^0.185.1",
    "typescript": "^7.0.2",
    "vite": "^8.1.5"
  }
```

(If the exact keys differ, read the file first and preserve every existing entry.) Add `"serve": "^14.2.4"` to that object, keeping alphabetical order:

```json
  "devDependencies": {
    "@types/three": "^0.185.1",
    "serve": "^14.2.4",
    "typescript": "^7.0.2",
    "vite": "^8.1.5"
  }
```

- [ ] **Step 3: Install so the lockfile updates**

Run: `cd /Users/arya/p/scroll-engine && npm install`
Expected: `serve` added, `package-lock.json` updated, exit 0.

- [ ] **Step 4: Verify the demo build and local serve work end-to-end**

```bash
cd /Users/arya/p/scroll-engine
npm run build:demo
ls dist-demo/index.html          # expect the file to exist
npx serve dist-demo -s -l 4300 &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4300/   # expect 200
curl -s http://localhost:4300/ | grep -c "scroll-engine"          # expect >= 1
kill %1 2>/dev/null
```

Expected: build succeeds, `dist-demo/index.html` exists, curl returns `200`, title grep ≥ 1. This proves the exact build + serve commands in `railway.json` work before deploying.

- [ ] **Step 5: Commit**

```bash
cd /Users/arya/p/scroll-engine
git add railway.json package.json package-lock.json
git commit -m "chore: Railway deploy config (build:demo + serve)"
```

- [ ] **Step 6: Merge the branch to main**

```bash
cd /Users/arya/p/scroll-engine
ALLOW_MAIN=1 git checkout main
ALLOW_MAIN=1 git merge feat/public-demo-page --ff-only
ALLOW_MAIN=1 git branch -d feat/public-demo-page
git log --oneline -3
```

---

### Task 4: Deploy scroll-engine to an isolated Railway project + custom domain

**Files:** none (deployment)

- [ ] **Step 1: Confirm the directory is not already linked to another project**

```bash
cd /Users/arya/p/scroll-engine
python3 -c "
import json
cfg = json.load(open('/Users/arya/.railway/config.json'))
print(cfg['projects'].get('/Users/arya/p/scroll-engine', {}).get('name', 'NOT LINKED'))
"
```

Expected: `NOT LINKED` (the parent `/Users/arya/p` is linked to `mixpilot`, but `railway` matches the most specific path; an unlinked child directory prints `NOT LINKED`). If it prints any project name other than a fresh scroll-engine project, STOP and report — do not deploy into an existing unrelated project.

- [ ] **Step 2: Create the isolated Railway project**

```bash
cd /Users/arya/p/scroll-engine
railway init --name scroll-engine --json
```

Expected: JSON with a new project `id` and `"name":"scroll-engine"`. This links `/Users/arya/p/scroll-engine` (only) to the new project.

- [ ] **Step 3: Deploy**

```bash
cd /Users/arya/p/scroll-engine
railway up --detach
```

If it errors "Multiple services found", re-run with `--service scroll-engine`. Expected: build logs URL printed.

- [ ] **Step 4: Wait for the build to finish and confirm SUCCESS**

Poll deploy status (run in background so it re-notifies on completion):

```bash
cd /Users/arya/p/scroll-engine
i=0
until railway status --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['environments']['edges'][0]['node']['serviceInstances']['edges'][0]['node']['latestDeployment']['status'])" | grep -qE "SUCCESS|FAILED|CRASHED"; do
  i=$((i+1)); [ $i -ge 30 ] && { echo TIMEOUT; break; }; sleep 10
done
railway status --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['environments']['edges'][0]['node']['serviceInstances']['edges'][0]['node']['latestDeployment']['status'])"
```

Expected terminal state: `SUCCESS`. If `FAILED`/`CRASHED`, read build logs (`railway logs --build`) — the most likely cause is `serve` not present at runtime; the documented fallback is Step 4a.

- [ ] **Step 4a: (Fallback, only if the deploy failed because `serve` is missing at runtime)**

Some Railpack runtime images prune devDependencies. If the runtime cannot find `serve`, replace the start command with Caddy's static file server (Railpack ships Caddy in its runtime image, proven by the syncoderslabs.com deploy). Change `railway.json`'s `deploy.startCommand` to serve `dist-demo` via a one-line Caddyfile written at start:

```json
  "deploy": {
    "startCommand": "caddy file-server --root dist-demo --listen :$PORT"
  }
```

Commit the change (`ALLOW_MAIN=1 git commit` on main), re-run `railway up --detach`, and repeat Step 4. (Caddy availability at runtime was confirmed for syncoderslabs.com; `caddy` is on PATH in the Railpack runtime.)

- [ ] **Step 5: Generate the Railway service domain and verify the site is live**

```bash
cd /Users/arya/p/scroll-engine
railway domain            # generates <something>.up.railway.app
```

Then verify (substitute the printed URL):

```bash
sleep 15
curl -s -o /dev/null -w "%{http_code}\n" https://<printed-url>/          # expect 200
curl -s https://<printed-url>/ | grep -c "scroll-engine"                 # expect >= 1
```

Also open it with `mcp__Claude_Browser__preview_start {url: "https://<printed-url>/"}`, screenshot to confirm the 3D canvas renders, and `read_console_messages` for zero errors.

- [ ] **Step 6: Add the custom domain**

```bash
cd /Users/arya/p/scroll-engine
railway domain scroll-engine.syncoderslabs.com --json
```

Expected: JSON including a `dnsRecords` array — a CNAME for `scroll-engine` pointing at a `*.up.railway.app` target, plus possibly a `_railway-verify` TXT. **Report these records to the user to add at their registrar** (a CNAME at a subdomain is valid everywhere, unlike the apex CNAME issue hit for the root domain). Claude has no registrar access.

- [ ] **Step 7: Report DNS handoff**

Present the exact record(s) (Type, Name, Value) in a table for the user to add. Note that `scroll-engine.syncoderslabs.com` goes live once DNS propagates and Railway issues the TLS certificate (minutes to hours). No commit — deployment only.

---

### Task 5: Add Railway deploy config to trinetra

**Files:**
- Create: `/Users/arya/p/trinetra/railway.json`
- Modify: `/Users/arya/p/trinetra/package.json`

- [ ] **Step 1: Create the feature branch**

```bash
cd /Users/arya/p/trinetra
git checkout -b chore/railway-deploy
git branch --show-current   # expect: chore/railway-deploy
```

- [ ] **Step 2: Create `railway.json`**

trinetra's `npm run build` (`tsc --noEmit && vite build`) outputs the static site to the default `dist/` directory.

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npx serve dist -s -l $PORT"
  }
}
```

- [ ] **Step 3: Add `serve` as a dependency**

trinetra is a private application (`"private": true`), not a published library, so `serve` can go in regular `dependencies` — this guarantees it survives to the runtime image even if Railpack prunes devDependencies. In `/Users/arya/p/trinetra/package.json`, the current `dependencies` block is:

```json
  "dependencies": {
    "gsap": "^3.15.0",
    "scroll-engine": "github:ashwaniarya/scroll-engine#main",
    "three": "^0.185.1"
  }
```

Add `"serve": "^14.2.4"` (keep alphabetical order):

```json
  "dependencies": {
    "gsap": "^3.15.0",
    "scroll-engine": "github:ashwaniarya/scroll-engine#main",
    "serve": "^14.2.4",
    "three": "^0.185.1"
  }
```

- [ ] **Step 4: Install so the lockfile updates**

Run: `cd /Users/arya/p/trinetra && npm install`
Expected: `serve` added, lockfile updated, exit 0. (The `scroll-engine` git dependency self-builds on install via its `prepare` script; an npm `allow-scripts`/`build-scripts` warning here is expected and harmless — the engine `dist` still builds, per project history.)

- [ ] **Step 5: Verify the build and local serve work end-to-end**

```bash
cd /Users/arya/p/trinetra
npm run build
ls dist/index.html                # expect the file to exist
npx serve dist -s -l 4301 &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4301/    # expect 200
kill %1 2>/dev/null
```

Expected: build succeeds, `dist/index.html` exists, curl returns `200`. This proves the `railway.json` build + serve commands before deploying.

- [ ] **Step 6: Commit and merge to main**

```bash
cd /Users/arya/p/trinetra
git add railway.json package.json package-lock.json
git commit -m "chore: Railway deploy config (vite build + serve)"
ALLOW_MAIN=1 git checkout main
ALLOW_MAIN=1 git merge chore/railway-deploy --ff-only
ALLOW_MAIN=1 git branch -d chore/railway-deploy
git log --oneline -3
```

---

### Task 6: Deploy trinetra to an isolated Railway project + custom domain

**Files:** none (deployment)

- [ ] **Step 1: Confirm the directory is not already linked**

```bash
cd /Users/arya/p/trinetra
python3 -c "
import json
cfg = json.load(open('/Users/arya/.railway/config.json'))
print(cfg['projects'].get('/Users/arya/p/trinetra', {}).get('name', 'NOT LINKED'))
"
```

Expected: `NOT LINKED`. If it prints an unrelated project name, STOP and report.

- [ ] **Step 2: Create the isolated Railway project**

```bash
cd /Users/arya/p/trinetra
railway init --name trinetra --json
```

Expected: JSON with a new project `id` and `"name":"trinetra"`.

- [ ] **Step 3: Deploy**

```bash
cd /Users/arya/p/trinetra
railway up --detach
```

If it errors "Multiple services found", re-run with `--service trinetra`. Expected: build logs URL printed.

- [ ] **Step 4: Wait for build SUCCESS**

```bash
cd /Users/arya/p/trinetra
i=0
until railway status --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['environments']['edges'][0]['node']['serviceInstances']['edges'][0]['node']['latestDeployment']['status'])" | grep -qE "SUCCESS|FAILED|CRASHED"; do
  i=$((i+1)); [ $i -ge 30 ] && { echo TIMEOUT; break; }; sleep 10
done
railway status --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['environments']['edges'][0]['node']['serviceInstances']['edges'][0]['node']['latestDeployment']['status'])"
```

Expected: `SUCCESS`. On failure, `railway logs --build`; the likely engine-build risk is the `scroll-engine` git dep's `prepare` step needing `tweakpane` (an engine peer dep used by its DevPanel). If the build fails on a missing `tweakpane`, the fallback is Step 4a.

- [ ] **Step 4a: (Fallback, only if the engine's prepare build fails on missing `tweakpane`)**

Add `tweakpane` to trinetra's `devDependencies` so the engine's `prepare` build resolves it during install:

```bash
cd /Users/arya/p/trinetra
npm install --save-dev tweakpane@^4.0.5
ALLOW_MAIN=1 git add package.json package-lock.json
ALLOW_MAIN=1 git commit -m "chore: add tweakpane for engine prepare build"
railway up --detach
```

Then repeat Step 4. (Per project history the git-dep build has succeeded on Vercel, so this fallback may be unnecessary — but it's the known failure mode to watch.)

- [ ] **Step 5: Generate the Railway domain and verify live**

```bash
cd /Users/arya/p/trinetra
railway domain
sleep 15
curl -s -o /dev/null -w "%{http_code}\n" https://<printed-url>/     # expect 200
```

Open with `mcp__Claude_Browser__preview_start {url: "https://<printed-url>/"}`, screenshot to confirm the TRINETRA hero/3D scene renders, `read_console_messages` for zero errors.

- [ ] **Step 6: Add the custom domain**

```bash
cd /Users/arya/p/trinetra
railway domain trinetra.syncoderslabs.com --json
```

Expected: JSON with `dnsRecords` (CNAME for `trinetra` → `*.up.railway.app`, plus possible `_railway-verify` TXT).

- [ ] **Step 7: Report DNS handoff**

Present the record(s) to the user in a table to add at their registrar. No commit — deployment only.

---

### Task 7: Wire the scroll-engine URL into syncoderslabs.com and redeploy

**Files:**
- Modify: `/Users/arya/p/syncoderslabs/js/products-data.js`

- [ ] **Step 1: Update the scroll-engine product URL**

In `/Users/arya/p/syncoderslabs/js/products-data.js`, the `scroll-engine` entry currently reads:

```js
  {
    name: 'scroll-engine',
    tagline: '3D scroll-driven website builder.',
    status: 'Live',
    url: '#',
  },
```

Change its `url` to the live subdomain:

```js
  {
    name: 'scroll-engine',
    tagline: '3D scroll-driven website builder.',
    status: 'Live',
    url: 'https://scroll-engine.syncoderslabs.com',
  },
```

(Leave `tv-shots-ads` and `automix` at `'#'` — they are out of scope for this work.)

- [ ] **Step 2: Verify the change locally**

```bash
cd /Users/arya/p/syncoderslabs
node --input-type=module -e "import('./js/products-data.js').then(m => console.log(m.PRODUCTS.find(p => p.name === 'scroll-engine').url))"
```

Expected output: `https://scroll-engine.syncoderslabs.com`

- [ ] **Step 3: Commit on main**

syncoderslabs.com is already on `main` in this session.

```bash
cd /Users/arya/p/syncoderslabs
ALLOW_MAIN=1 git add js/products-data.js
ALLOW_MAIN=1 git commit -m "feat: point scroll-engine product card at live subdomain"
```

- [ ] **Step 4: Redeploy syncoderslabs.com**

```bash
cd /Users/arya/p/syncoderslabs
railway up --detach --service syncoderslabs
```

Wait for SUCCESS (reuse the poll pattern from Task 4 Step 4), then verify the served data module reflects the new URL:

```bash
sleep 20
curl -s "https://syncoderslabs-production.up.railway.app/js/products-data.js" | grep -c "scroll-engine.syncoderslabs.com"
```

Expected: `1`.

- [ ] **Step 5: Confirm the product card link in the browser**

`mcp__Claude_Browser__navigate` to `https://syncoderslabs-production.up.railway.app/`, `read_page`, and confirm the `scroll-engine` card's link `href` is now `https://scroll-engine.syncoderslabs.com` (not `#`).

---

### Task 8: Final cross-site verification and status report

**Files:** none (verification only)

- [ ] **Step 1: Verify all three Railway services report healthy**

For each of the three project directories (`syncoderslabs`, `scroll-engine`, `trinetra`), run `railway status` and confirm the latest deployment is SUCCESS/online and a domain is attached.

- [ ] **Step 2: Verify the Railway (`.up.railway.app`) URLs all return 200**

```bash
curl -s -o /dev/null -w "syncoderslabs %{http_code}\n" https://syncoderslabs-production.up.railway.app/
curl -s -o /dev/null -w "scroll-engine %{http_code}\n" https://<scroll-engine-railway-url>/
curl -s -o /dev/null -w "trinetra %{http_code}\n" https://<trinetra-railway-url>/
```

Expected: all `200`.

- [ ] **Step 3: Report custom-domain DNS status**

Summarize, per custom domain (`syncoderslabs.com`, `scroll-engine.syncoderslabs.com`, `trinetra.syncoderslabs.com`), the DNS records the user still needs to add (or that are pending cert validation), pulled from `railway domain status <domain>`. End with one clear next action: which records to add where.

No commit — verification only.

---
