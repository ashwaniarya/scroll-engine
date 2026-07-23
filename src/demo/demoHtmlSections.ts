import gsap from 'gsap'
import { HtmlLayer } from '../layers/htmlLayer'

function sectionElement(className: string, html: string): HTMLElement {
  const element = document.createElement('section')
  element.className = className
  element.innerHTML = html
  return element
}

function createHeroLayer(): HtmlLayer {
  const element = sectionElement(
    'hero',
    `<h1>scroll-engine</h1>
     <p>layered renders · one scroll · live props</p>
     <span class="scroll-hint">scroll</span>`,
  )
  const hero = new HtmlLayer('hero', element)
  hero.scrollRange = { start: 0.02, end: 0.15 }
  hero.scrub(
    gsap.timeline({ paused: true }).to(element, { autoAlpha: 0, y: -80, ease: 'power1.in', duration: 1 }),
  )
  return hero
}

function createCaptionLayer(name: string, title: string, body: string, start: number, end: number): HtmlLayer {
  const element = sectionElement('caption', `<h2>${title}</h2><p>${body}</p>`)
  const caption = new HtmlLayer(name, element)
  caption.scrollRange = { start, end }
  caption.scrub(
    gsap
      .timeline({ paused: true })
      .fromTo(
        element,
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' },
      )
      .to(element, { autoAlpha: 0, y: -40, duration: 0.3, ease: 'power2.in' }, 0.7),
  )
  return caption
}

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
  ]
}
