import { describe, expect, it } from '@jest/globals'
import { shuffleArray } from './shuffle'

describe('shuffleArray', () => {
  it('returns a new array without mutating the original input', () => {
    const source = ['a', 'b', 'c', 'd']
    const before = [...source]

    const shuffled = shuffleArray(source)

    expect(source).toEqual(before)
    expect(shuffled).toHaveLength(source.length)
    expect(shuffled).not.toBe(source)
    expect([...shuffled].sort()).toEqual([...source].sort())
  })
})
