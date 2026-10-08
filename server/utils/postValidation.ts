import { createError } from 'h3'
import { isValidDeliverableKey } from './deliverableKey'

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

/**
 * Accepts a non-negative, finite price with at most 2 decimal places (i.e.
 * a whole number of cents). This guards the root cause of the PayPal C1
 * bug: browse_items.price is quoted to PayPal and verified against a paid
 * capture using two different roundings, which disagree by a cent for any
 * price of the form x.xx5 -- rejecting a 3rd decimal place at the source
 * closes that gap for every future price, not just the one bug site.
 *
 * Deliberately NOT written as `Math.round(price * 100) !== price * 100`
 * (the naive-looking check): IEEE-754 double multiplication means ordinary,
 * perfectly valid 2-decimal prices don't always land on an exact integer of
 * cents -- e.g. `39.95 * 100 === 3995.0000000000005`, not `3995` -- so that
 * version would reject 39.95 itself. Rounding back down to euros before
 * comparing absorbs that float noise while still catching a genuine 3rd
 * decimal place (39.955 -> round-trips to 39.96, which is !== 39.955).
 * Verified by sweeping every 2-decimal value in 0..300 (all accepted) and
 * every non-2-decimal 3-decimal value in 0..300 (all rejected).
 */
export function isValidPrice(price: unknown): boolean {
  return typeof price === 'number'
    && Number.isFinite(price)
    && price >= 0
    && Math.round(price * 100) / 100 === price
}

/**
 * Format-validates a download_key at write time: it's stored as free text
 * with no format check in the schema, so a typo'd key is indistinguishable
 * from a real one until a paying customer's download 404s. This can't
 * confirm the R2 object actually exists (that's checked at checkout time
 * instead, see the `bucket.head()` calls in server/api/checkout/*.post.ts)
 * -- it only rejects values that could never have come from the upload flow.
 *
 * Delegates to isValidDeliverableKey rather than carrying its own regex:
 * there used to be two patterns for this one string, and the looser one here
 * accepted keys the upload flow can never produce. One definition, in the
 * module that also GENERATES the key, cannot drift from itself.
 */
export function isValidDownloadKey(key: unknown): boolean {
  return isValidDeliverableKey(key)
}
