import { describe, expect, it, vi } from 'vitest'
import { slugify, assertFeatureLimit } from './postValidation'

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
