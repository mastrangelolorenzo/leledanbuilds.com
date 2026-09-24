import { describe, expect, it, vi } from 'vitest'
import { slugify, assertFeatureLimit, isUniqueConstraintError, isValidPrice, isValidDownloadKey } from './postValidation'

describe('slugify', () => {
  it('lowercases, strips punctuation and hyphenates spaces', () => {
    expect(slugify('Freaky Nikki: Obsession Movie!')).toBe('freaky-nikki-obsession-movie')
  })
})

describe('assertFeatureLimit', () => {
  function fakeDbWithCount(count: number) {
    const first = vi.fn().mockResolvedValue({ count })
    const bind = vi.fn().mockReturnValue({ first })
    const prepare = vi.fn().mockReturnValue({ bind })
    return { prepare, bind, first }
  }

  it('does not throw when fewer than 4 posts are featured', async () => {
    const db = fakeDbWithCount(3)
    await expect(assertFeatureLimit(db as never, 'home', null)).resolves.toBeUndefined()
  })

  it('throws a 409 when exactly 4 posts are already featured', async () => {
    const db = fakeDbWithCount(4)
    await expect(assertFeatureLimit(db as never, 'home', null)).rejects.toMatchObject({ statusCode: 409 })
  })
})

describe('isUniqueConstraintError', () => {
  it('returns true for a UNIQUE constraint failure', () => {
    expect(isUniqueConstraintError(new Error('UNIQUE constraint failed: posts.slug'))).toBe(true)
  })

  it('returns false for other errors', () => {
    expect(isUniqueConstraintError(new Error('some other error'))).toBe(false)
  })
})

describe('isValidPrice', () => {
  // The exact cases the final-fixes doc asked to be confirmed before relying
  // on this validator.
  it('accepts a plain 2-decimal price', () => {
    expect(isValidPrice(39.95)).toBe(true)
  })

  it('accepts a whole-euro price', () => {
    expect(isValidPrice(120)).toBe(true)
  })

  it('rejects a 3-decimal price (the exact shape that caused the PayPal C1 bug)', () => {
    expect(isValidPrice(39.955)).toBe(false)
  })

  it('rejects a negative price', () => {
    expect(isValidPrice(-5)).toBe(false)
  })

  it('rejects NaN', () => {
    expect(isValidPrice(NaN)).toBe(false)
  })

  it('rejects Infinity', () => {
    expect(isValidPrice(Infinity)).toBe(false)
  })

  it('accepts zero', () => {
    expect(isValidPrice(0)).toBe(true)
  })

  it('rejects a non-number', () => {
    expect(isValidPrice('39.95')).toBe(false)
  })

  // Discriminates against the naive `Math.round(price * 100) !== price * 100`
  // check the doc's draft code proposed: that expression fails on ordinary
  // 2-decimal prices because 39.95 * 100 is 3995.0000000000005 in IEEE-754,
  // not exactly 3995 -- it would wrongly reject a completely valid price.
  it('accepts every 2-decimal price from 0.00 to 300.00 despite float noise in price * 100', () => {
    const rejected: number[] = []
    for (let cents = 0; cents <= 30000; cents++) {
      const price = cents / 100
      if (!isValidPrice(price)) rejected.push(price)
    }
    expect(rejected).toEqual([])
  })

  it('rejects every non-2-decimal 3-decimal price from 0.001 to 300.000', () => {
    const wronglyAccepted: number[] = []
    for (let milli = 1; milli <= 300000; milli++) {
      if (milli % 10 === 0) continue // an exact 2-decimal value, not a 3-decimal one
      const price = milli / 1000
      if (isValidPrice(price)) wronglyAccepted.push(price)
    }
    expect(wronglyAccepted).toEqual([])
  })
})

describe('isValidDownloadKey', () => {
  it('accepts a real key shape produced by the upload endpoint', () => {
    expect(isValidDownloadKey(`deliverables/${crypto.randomUUID()}.zip`)).toBe(true)
    expect(isValidDownloadKey(`deliverables/${crypto.randomUUID()}.schematic`)).toBe(true)
    expect(isValidDownloadKey(`deliverables/${crypto.randomUUID()}.mcworld`)).toBe(true)
  })

  it('rejects a key missing the deliverables/ prefix', () => {
    expect(isValidDownloadKey(`${crypto.randomUUID()}.zip`)).toBe(false)
  })

  it('rejects a key with no UUID', () => {
    expect(isValidDownloadKey('deliverables/not-a-uuid.zip')).toBe(false)
  })

  it('rejects a key with no extension', () => {
    expect(isValidDownloadKey(`deliverables/${crypto.randomUUID()}`)).toBe(false)
  })

  it('rejects a path-traversal attempt', () => {
    expect(isValidDownloadKey(`../deliverables/${crypto.randomUUID()}.zip`)).toBe(false)
  })

  it('rejects a non-string value', () => {
    expect(isValidDownloadKey(123)).toBe(false)
  })

  // Whether a null/absent download_key is allowed at all (e.g. an item with
  // no file attached yet) is the caller's decision, not this function's --
  // it always rejects non-string input, null and undefined included.
  it('rejects null and undefined', () => {
    expect(isValidDownloadKey(null)).toBe(false)
    expect(isValidDownloadKey(undefined)).toBe(false)
  })
})
