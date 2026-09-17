import { describe, expect, it, vi } from 'vitest'
import { getFeaturedPosts } from './posts'

function fakeDb(rows: unknown[]) {
  const all = vi.fn().mockResolvedValue({ results: rows })
  const bind = vi.fn().mockReturnValue({ all })
  const prepare = vi.fn().mockReturnValue({ bind })
  return { prepare, bind, all }
}

describe('getFeaturedPosts', () => {
  it('queries the featured_home column and limit when list is "home"', async () => {
    const rows = [{ id: 1, title: 'A', slug: 'a', image_url: '/a.webp', teaser: 't', description: 'd' }]
    const db = fakeDb(rows)

    const result = await getFeaturedPosts(db as never, 'home', 4)

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('featured_home = 1'))
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('sort_order_home'))
    expect(db.bind).toHaveBeenCalledWith(4)
    expect(result).toEqual(rows)
  })

  it('queries the featured_portfolio column when list is "portfolio"', async () => {
    const db = fakeDb([])

    await getFeaturedPosts(db as never, 'portfolio', 4)

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('featured_portfolio = 1'))
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('sort_order_portfolio'))
  })

  it('returns an empty array when the query has no results', async () => {
    const db = fakeDb([])

    const result = await getFeaturedPosts(db as never, 'home', 4)

    expect(result).toEqual([])
  })
})
