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

describe('getFeaturedPosts limit', () => {
  function spyDb() {
    const calls: { sql: string, args: unknown[] }[] = []
    return {
      calls,
      prepare(sql: string) {
        return {
          bind(...args: unknown[]) {
            calls.push({ sql, args })
            return { all: async () => ({ results: [] }) }
          },
        }
      },
    }
  }

  it('omits LIMIT entirely when no limit is given', async () => {
    // /portfolio is the full gallery -- a stray LIMIT here is exactly the
    // bug this replaced, where both lists were silently capped at 4.
    const db = spyDb()
    await getFeaturedPosts(db as never, 'portfolio')
    expect(db.calls[0]!.sql).not.toMatch(/LIMIT/i)
    expect(db.calls[0]!.args).toHaveLength(0)
  })

  it('applies LIMIT when one is given', async () => {
    const db = spyDb()
    await getFeaturedPosts(db as never, 'home', 4)
    expect(db.calls[0]!.sql).toMatch(/LIMIT \?/)
    expect(db.calls[0]!.args).toEqual([4])
  })

  it('reads the column pair matching the list', async () => {
    const db = spyDb()
    await getFeaturedPosts(db as never, 'home', 4)
    expect(db.calls[0]!.sql).toContain('featured_home')
    expect(db.calls[0]!.sql).toContain('sort_order_home')

    const db2 = spyDb()
    await getFeaturedPosts(db2 as never, 'portfolio')
    expect(db2.calls[0]!.sql).toContain('featured_portfolio')
    expect(db2.calls[0]!.sql).toContain('sort_order_portfolio')
  })
})
