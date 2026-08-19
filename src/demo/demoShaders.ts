import * as THREE from 'three'
import { ShaderLayer } from '../layers/shaderLayer'

const NOISE_GLSL = /* glsl */ `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * valueNoise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}
`

const NEBULA_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uOpacity;
uniform vec2 uResolution;

${NOISE_GLSL}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (vUv - 0.5) * aspect;
  float t = uTime * 0.025;

  // domain-warped fbm for slow, roiling cloud motion
  vec2 warp = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 7.3));
  float clouds = fbm(p * 1.9 + warp * 1.6 + t * 0.5);
  float wisps = fbm(p * 3.1 - t * 0.7 + warp);

  vec3 base = vec3(0.020, 0.028, 0.052);
  vec3 coral = vec3(0.92, 0.34, 0.26);
  vec3 teal = vec3(0.16, 0.74, 0.66);

  vec3 col = base;
  col = mix(col, coral * 0.55, smoothstep(0.34, 0.80, clouds));
  col = mix(col, teal * 0.42, smoothstep(0.60, 0.95, wisps));

  // keep the center calm (text lives here) and let the edges bloom
  float r = length(p);
  col *= 0.55 + 0.62 * smoothstep(0.15, 1.15, r);

  gl_FragColor = vec4(col, uOpacity);
}
`

const GRAIN_VIGNETTE_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uOpacity;
uniform vec2 uResolution;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (vUv - 0.5) * aspect;
  float r = length(p);

  // cinematic vignette — darkens edges, keeps center readable
  float vignette = smoothstep(0.48, 1.25, r) * 0.62;

  // animated film grain (shifts every frame via fract(uTime))
  float g = hash(vUv * uResolution + fract(uTime) * 137.0) - 0.5;
  float grain = abs(g) * 0.10;

  float alpha = clamp(vignette + grain, 0.0, 0.72);
  gl_FragColor = vec4(vec3(0.0), alpha * uOpacity);
}
`

export function createNebulaLayer(): ShaderLayer {
  const layer = new ShaderLayer('nebula', { fragmentShader: NEBULA_FRAGMENT })
  layer.scrollRange = { start: 0, end: 1 }
  layer.zIndex.value = -20
  return layer
}

export function createGrainVignetteLayer(): ShaderLayer {
  const layer = new ShaderLayer('grain-vignette', {
    fragmentShader: GRAIN_VIGNETTE_FRAGMENT,
    blending: THREE.NormalBlending,
  })
  layer.scrollRange = { start: 0, end: 1 }
  layer.zIndex.value = 20
  return layer
}
