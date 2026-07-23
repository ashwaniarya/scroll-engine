export interface SingletonAccess<T> {
  claim(instance: T): T
  get(): T
  clear(): void
}

export function singletonAccess<T>(label: string): SingletonAccess<T> {
  let current: T | null = null
  return {
    claim(instance: T): T {
      if (current) throw new Error(`${label} already created`)
      current = instance
      return instance
    },
    get(): T {
      if (!current) throw new Error(`${label}.create() has not been called`)
      return current
    },
    clear(): void {
      current = null
    },
  }
}
