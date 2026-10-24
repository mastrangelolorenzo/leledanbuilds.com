import { describe, expect, it } from 'vitest'
import { isValidRating, ratingAverage } from './rating'

describe('isValidRating', () => {
  it('accepts every whole star from 1 to 5', () => {
    for (const n of [1, 2, 3, 4, 5]) expect(isValidRating(n)).toBe(true)
  })

  it('rejects scores outside the range', () => {
    expect(isValidRating(0)).toBe(false)
    expect(isValidRating(6)).toBe(false)
    expect(isValidRating(-3)).toBe(false)
  })

  // The column's CHECK constraint would turn any of these into a raw SQL
  // error rather than a 400, which is the whole point of checking first.
  it('rejects half stars and non-numbers', () => {
    expect(isValidRating(4.5)).toBe(false)
    expect(isValidRating('4')).toBe(false)
    expect(isValidRating(Number.NaN)).toBe(false)
    expect(isValidRating(Number.POSITIVE_INFINITY)).toBe(false)
    expect(isValidRating(null)).toBe(false)
    expect(isValidRating(undefined)).toBe(false)
  })
})

describe('ratingAverage', () => {
  it('averages to one decimal', () => {
    expect(ratingAverage(10, 4)).toBe(2.5)
    expect(ratingAverage(10, 3)).toBe(3.3)
    expect(ratingAverage(11, 3)).toBe(3.7)
  })

  it('keeps a whole average whole', () => {
    expect(ratingAverage(20, 4)).toBe(5)
  })

  // An unrated item must read as 0, not NaN: the page prints this number.
  it('returns 0 when nobody has rated', () => {
    expect(ratingAverage(0, 0)).toBe(0)
  })
})
