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

export async function getFeaturedPosts(
  db: D1Like,
  list: 'home' | 'portfolio',
  limit = 4
): Promise<Post[]> {
  const filterColumn = list === 'home' ? 'featured_home' : 'featured_portfolio'
  const orderColumn = list === 'home' ? 'sort_order_home' : 'sort_order_portfolio'
  const sql = `SELECT id, title, slug, image_url, teaser, description FROM posts WHERE ${filterColumn} = 1 ORDER BY ${orderColumn} ASC LIMIT ?`
  const statement = db.prepare(sql)
  const { results } = await statement.bind(limit).all()
  return results as Post[]
}
