import { createError } from 'h3'

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

interface CountRow {
  count: number
}

export async function assertFeatureLimit(
  db: { prepare: (sql: string) => { bind: (...args: unknown[]) => { first: <T>() => Promise<T | null> } } },
  list: 'home' | 'portfolio',
  excludeId: number | null
): Promise<void> {
  const column = list === 'home' ? 'featured_home' : 'featured_portfolio'
  const sql = excludeId !== null
    ? `SELECT COUNT(*) as count FROM posts WHERE ${column} = 1 AND id != ?`
    : `SELECT COUNT(*) as count FROM posts WHERE ${column} = 1`

  const statement = db.prepare(sql)
  const bound = excludeId !== null ? statement.bind(excludeId) : statement.bind()
  const row = await bound.first<CountRow>()

  if ((row?.count ?? 0) >= 4) {
    throw createError({
      statusCode: 409,
      statusMessage: `At most 4 posts can be featured on "${list}". Un-feature one first.`,
    })
  }
}

export function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('UNIQUE constraint failed')
}
