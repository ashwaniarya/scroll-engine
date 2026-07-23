import { describe, expect, it, vi } from 'vitest'
import { derived, Prop } from './prop'

describe('Prop', () => {
  it('stores and returns the current value', () => {
    const count = new Prop(1)
    count.value = 5
    expect(count.value).toBe(5)
  })

  it('notifies synchronously with value and previous', () => {
    const count = new Prop(1)
    const listener = vi.fn()
    count.subscribe(listener)
    count.value = 2
    expect(listener).toHaveBeenCalledExactlyOnceWith(2, 1)
  })

  it('does not notify when the value is Object.is-equal', () => {
    const count = new Prop(3)
    const listener = vi.fn()
    count.subscribe(listener)
    count.value = 3
    expect(listener).not.toHaveBeenCalled()
  })

  it('stops delivery after unsubscribe', () => {
    const count = new Prop(0)
    const listener = vi.fn()
    const unsubscribe = count.subscribe(listener)
    unsubscribe()
    count.value = 1
    expect(listener).not.toHaveBeenCalled()
  })

  it('handles unsubscribe during notification safely', () => {
    const count = new Prop(0)
    const second = vi.fn()
    const unsubscribeSecond = count.subscribe(() => unsubscribeSecond())
    count.subscribe(second)
    count.value = 1
    expect(second).toHaveBeenCalledExactlyOnceWith(1, 0)
  })

  it('notifies listeners in subscription order', () => {
    const count = new Prop(0)
    const order: string[] = []
    count.subscribe(() => order.push('first'))
    count.subscribe(() => order.push('second'))
    count.value = 1
    expect(order).toEqual(['first', 'second'])
  })

  it('throws when a listener writes back a new value into the notifying prop', () => {
    const count = new Prop(0)
    count.subscribe(() => {
      count.value = 99
    })
    expect(() => {
      count.value = 1
    }).toThrow(/notifying/)
  })

  it('settles convergent cross-subscribed props without throwing', () => {
    const left = new Prop(0)
    const right = new Prop(0)
    left.subscribe((value) => {
      right.value = value
    })
    right.subscribe((value) => {
      left.value = value
    })
    left.value = 7
    expect(left.value).toBe(7)
    expect(right.value).toBe(7)
  })
})

describe('derived', () => {
  it('computes the initial value immediately', () => {
    const width = new Prop(4)
    const height = new Prop(3)
    const area = derived([width, height], () => width.value * height.value)
    expect(area.value).toBe(12)
  })

  it('recomputes when any source changes', () => {
    const width = new Prop(4)
    const height = new Prop(3)
    const area = derived([width, height], () => width.value * height.value)
    const listener = vi.fn()
    area.subscribe(listener)
    height.value = 5
    expect(area.value).toBe(20)
    expect(listener).toHaveBeenCalledExactlyOnceWith(20, 12)
  })

  it('gates equal recomputed results', () => {
    const input = new Prop(2)
    const parity = derived([input], () => input.value % 2)
    const listener = vi.fn()
    parity.subscribe(listener)
    input.value = 4
    expect(listener).not.toHaveBeenCalled()
  })
})
