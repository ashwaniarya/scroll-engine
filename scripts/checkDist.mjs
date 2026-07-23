const expectedExports = [
  'Engine',
  'ScrollController',
  'ThreeRenderer',
  'HtmlRenderer',
  'Layer',
  'ThreeLayer',
  'HtmlLayer',
  'ShaderLayer',
  'DevPanel',
  'bindPropToPane',
  'Prop',
  'derived',
  'createStage',
  'clamp01',
  'damp',
  'remapProgress',
  'directionOf',
]

const dist = await import(new URL('../dist/index.js', import.meta.url))
const missing = expectedExports.filter((name) => !(name in dist))
if (missing.length > 0) {
  console.error(`dist/index.js is missing exports: ${missing.join(', ')}`)
  process.exit(1)
}
console.log(`dist OK — ${expectedExports.length} exports present`)
