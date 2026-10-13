export interface Post {
  id: number
  title: string
  slug: string
  image_url: string
  teaser: string
  description: string
}

interface PreparedStatementLike {
  bind: (...args: unknown[]) => { all: () => Promise<{ results: unknown[] }> }
}

interface D1Like {
  prepare: (sql: string) => PreparedStatementLike
}

/**
 * `limit` omitted means every featured post, which is what the portfolio
 * page wants: it is the full gallery. The home page passes 4 because its
 * layout is a fixed four-up row.
 */
export async function getFeaturedPosts(
  db: D1Like,
  list: 'home' | 'portfolio',
  limit?: number
): Promise<Post[]> {
  const filterColumn = list === 'home' ? 'featured_home' : 'featured_portfolio'
  const orderColumn = list === 'home' ? 'sort_order_home' : 'sort_order_portfolio'
  const base = `SELECT id, title, slug, image_url, teaser, description FROM posts WHERE ${filterColumn} = 1 ORDER BY ${orderColumn} ASC`

  if (limit === undefined) {
    const { results } = await db.prepare(base).bind().all()
    return results as Post[]
  }

  const { results } = await db.prepare(`${base} LIMIT ?`).bind(limit).all()
  return results as Post[]
}
