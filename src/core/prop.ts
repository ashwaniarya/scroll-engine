type Listener<T> = (value: T, previous: T) => void

export type Unsubscribe = () => void

export interface ReadonlyProp<T> {
  readonly value: T
  subscribe(listener: Listener<T>): Unsubscribe
}

export class Prop<T> implements ReadonlyProp<T> {
  private current: T
  private readonly listeners: Listener<T>[] = []
  private notifying = false

  constructor(initial: T) {
    this.current = initial
  }

  get value(): T {
    return this.current
  }

  set value(next: T) {
    if (Object.is(next, this.current)) return
    if (this.notifying) {
      throw new Error('Prop written back into while notifying its own listeners')
    }
    const previous = this.current
    this.current = next
    this.notifying = true
    try {
      for (const listener of [...this.listeners]) {
        listener(next, previous)
      }
    } finally {
      this.notifying = false
    }
  }

  subscribe(listener: Listener<T>): Unsubscribe {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index !== -1) this.listeners.splice(index, 1)
    }
  }
}

export function derived<T>(sources: ReadonlyProp<unknown>[], compute: () => T): ReadonlyProp<T> {
  const output = new Prop(compute())
  for (const source of sources) {
    source.subscribe(() => {
      output.value = compute()
    })
  }
  return output
}
