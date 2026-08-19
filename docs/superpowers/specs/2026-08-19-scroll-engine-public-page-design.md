# scroll-engine Public Page + TRINETRA Deploy — Design

## Purpose

syncoderslabs.com lists scroll-engine as a product, but its "Visit" link is a `#` placeholder — there is no live URL anywhere for scroll-engine. The repo has a real interactive tech demo (`src/demo/demoThreeLayers.ts` + `demoHtmlSections.ts`) and a more polished real-world example (TRINETRA, a 7-screen mythic scroll story built on scroll-engine), but neither has ever been deployed publicly.

This spec covers: humanizing the existing demo's copy, deploying it publicly, deploying TRINETRA publicly as a linked example, and wiring both into the existing site (syncoderslabs.com's product card, and a link from scroll-engine's page to TRINETRA).

## Content plan — humanizing the demo

The existing demo copy (`src/demo/demoHtmlSections.ts`) is accurate, human-written, and technical — it explains real engine mechanics as the visitor scrolls ("This torus knot is a ThreeLayer with its own scene and camera..."). It is not being rewritten. Two things are missing and get added:

1. **Improved hero section** — the existing "scroll-engine" title and tagline (`layered renders · one scroll · live props`) gain one added plain-language sentence explaining what the engine is for, before the two existing technical captions play out.
2. **New outro/CTA section** — a new `HtmlLayer` added after the last existing caption:
   - Install snippet: `npm install github:ashwaniarya/scroll-engine three gsap`
   - Link to the GitHub repo (`github.com/ashwaniarya/scroll-engine`)
   - Link to TRINETRA, framed as "built with this"

This file is shared between local dev (`npm run dev`) and the deployed demo build (`npm run build:demo`) — the improvement benefits both, and there is no separate "public" copy of the demo content to keep in sync.

The two existing technical captions (torus knot / crossfade explanation) are untouched.

## Deployment: scroll-engine.syncoderslabs.com

- Build: `npm install && npm run build:demo` (existing script: `tsc --noEmit && vite build --outDir dist-demo`) → static output in `dist-demo/`.
- Serve: static file serving. Exact Railway config (auto-detected static site vs. explicit `npx serve` start command) is determined empirically during implementation, the same way syncoderslabs.com's actual Railpack behavior (auto-static-detection, ignoring a hand-written `nixpacks.toml`) was discovered rather than assumed up front.
- New, isolated Railway project named `scroll-engine`, created and linked specifically from the `/Users/arya/p/scroll-engine` directory. Directory-to-project isolation must be verified before any deploy runs (same due-diligence as the syncoderslabs.com deploy, where `~/p` was found already linked to the unrelated `mixpilot` project).
- Custom domain: `scroll-engine.syncoderslabs.com` (CNAME at a subdomain — valid everywhere, unlike the apex-domain restriction hit for the root `syncoderslabs.com` domain). DNS records are generated via `railway domain` and handed to the user to add at their registrar; Claude does not have registrar access.

## Deployment: trinetra.syncoderslabs.com

- TRINETRA (`/Users/arya/p/trinetra`) is already pushed to GitHub and fully in sync with `origin/main` (verified directly — no push needed, despite an earlier stale assumption that it wasn't pushed yet).
- Build: `npm install && npm run build` (existing script: `tsc --noEmit && vite build`) → static output in default `dist/`.
- Serve: static file serving, same approach as scroll-engine's demo.
- New, isolated Railway project named `trinetra`, created and linked specifically from `/Users/arya/p/trinetra`, with the same directory-isolation verification.
- Custom domain: `trinetra.syncoderslabs.com`, same DNS handoff process as above.

## Wiring

- scroll-engine's demo page links out to `https://trinetra.syncoderslabs.com` in its new outro section.
- `syncoderslabs.com`'s `js/products-data.js`: the `scroll-engine` product's `url` field changes from `'#'` to `'https://scroll-engine.syncoderslabs.com'`. syncoderslabs.com is then redeployed (existing Railway project, already live) so the product card takes effect.
- TRINETRA is not referenced anywhere on syncoderslabs.com directly — it is only reachable via the link on scroll-engine's own page, per explicit scoping decision.

## Testing / verification

Both scroll-engine's demo and TRINETRA are interactive WebGL/Three.js scroll experiences — there is no unit-test-appropriate surface being added (the existing engine already has its own `*.test.ts` files for core logic, untouched by this work). Verification is browser-based smoke testing, consistent with the syncoderslabs.com build: page loads, WebGL canvas renders, scrolling triggers the expected layer transitions (captions fade in/out, camera moves), zero console errors, and the new outro section's links resolve to the right URLs.

## Out of scope

- Rewriting the two existing technical demo captions (they're accurate, stay as-is).
- Adding TRINETRA to syncoderslabs.com's own product list or navigation.
- A custom domain or public deployment for anything beyond scroll-engine's demo and TRINETRA (e.g., no new deploy for tv-shots-ads or automix as part of this work).
- Build tooling changes to either repo beyond what's needed to build the existing `build:demo` / `build` scripts for static output (no new dependencies, no test framework additions).
