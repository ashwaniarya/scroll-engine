export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function damp(current: number, target: number, lambda: number, deltaSeconds: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * deltaSeconds))
}

export function remapProgress(globalProgress: number, start: number, end: number): number {
  if (end <= start) return globalProgress < start ? 0 : 1
  return clamp01((globalProgress - start) / (end - start))
}

export function directionOf(velocity: number, deadzone: number): -1 | 0 | 1 {
  if (Math.abs(velocity) <= deadzone) return 0
  return velocity > 0 ? 1 : -1
}
