import { describe, expect, it } from 'vitest'
import { clamp01, damp, directionOf, remapProgress } from './scrollMath'

describe('clamp01', () => {
  it('clamps below, inside, and above the range', () => {
    expect(clamp01(-0.5)).toBe(0)
    expect(clamp01(0)).toBe(0)
    expect(clamp01(0.42)).toBe(0.42)
    expect(clamp01(1)).toBe(1)
    expect(clamp01(1.5)).toBe(1)
  })
})

describe('damp', () => {
  it('moves current toward target without overshooting', () => {
    const next = damp(0, 1, 6, 1 / 60)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(1)
  })

  it('is framerate independent: one 60fps step equals four 15fps quarter-steps', () => {
    const oneStep = damp(0, 1, 6, 4 / 60)
    let fourSteps = 0
    for (let step = 0; step < 4; step += 1) {
      fourSteps = damp(fourSteps, 1, 6, 1 / 60)
    }
    expect(oneStep).toBeCloseTo(fourSteps, 10)
  })

  it('converges monotonically toward the target', () => {
    let current = 0
    let previous = current
    for (let step = 0; step < 100; step += 1) {
      current = damp(current, 1, 6, 1 / 60)
      expect(current).toBeGreaterThan(previous)
      expect(current).toBeLessThanOrEqual(1)
      previous = current
    }
    expect(current).toBeCloseTo(1, 3)
  })
})

describe('remapProgress', () => {
  it('clamps outside the range', () => {
    expect(remapProgress(0.1, 0.25, 0.75)).toBe(0)
    expect(remapProgress(0.9, 0.25, 0.75)).toBe(1)
  })

  it('maps the midpoint to 0.5', () => {
    expect(remapProgress(0.5, 0.25, 0.75)).toBeCloseTo(0.5, 10)
  })

  it('treats a zero-width range as a step function', () => {
    expect(remapProgress(0.49, 0.5, 0.5)).toBe(0)
    expect(remapProgress(0.5, 0.5, 0.5)).toBe(1)
    expect(remapProgress(0.51, 0.5, 0.5)).toBe(1)
  })
})

describe('directionOf', () => {
  it('returns 0 inside the deadzone', () => {
    expect(directionOf(0, 0.01)).toBe(0)
    expect(directionOf(0.009, 0.01)).toBe(0)
    expect(directionOf(-0.01, 0.01)).toBe(0)
  })

  it('returns the sign outside the deadzone', () => {
    expect(directionOf(0.2, 0.01)).toBe(1)
    expect(directionOf(-0.2, 0.01)).toBe(-1)
  })
})
