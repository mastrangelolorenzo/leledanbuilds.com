// server/api/browse-items/[id]/rating.put.ts
//
// Sets the current user's 1-5 star rating for a browse item. A PUT rather
// than a POST because it is idempotent: re-sending the same score leaves the
// same single row, and sending a different one replaces it. Rating again is
// how you change your mind, so there is no separate "update" route.
import { requireAuth } from '../../../utils/requireAuth'
import { isValidRating, ratingAverage, MIN_RATING, MAX_RATING } from '../../../utils/rating'

interface AggregateRow {
  count: number
  total: number
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'id must be a valid integer.' })
  }

  const body = await readBody<{ rating?: unknown }>(event)
  const rating = body?.rating
  if (!isValidRating(rating)) {
    throw createError({ statusCode: 400, statusMessage: `rating must be a whole number from ${MIN_RATING} to ${MAX_RATING}.` })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const item = await db.prepare('SELECT id FROM browse_items WHERE id = ?').bind(id).first<{ id: number }>()
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found.' })
  }

  // ON CONFLICT against the unique index, rather than SELECT-then-INSERT:
  // two requests from the same person (double-click, two tabs) would
  // otherwise race into a duplicate insert, and here the second simply
  // overwrites the first.
  await db
    .prepare(
      `INSERT INTO browse_item_ratings (user_id, browse_item_id, rating)
       VALUES (?, ?, ?)
       ON CONFLICT (user_id, browse_item_id)
       DO UPDATE SET rating = excluded.rating, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    )
    .bind(session.userId, id, rating)
    .run()

  const agg = await db
    .prepare('SELECT COUNT(*) as count, COALESCE(SUM(rating), 0) as total FROM browse_item_ratings WHERE browse_item_id = ?')
    .bind(id)
    .first<AggregateRow>()

  const count = agg?.count ?? 0
  return {
    my_rating: rating,
    rating_count: count,
    rating_avg: ratingAverage(agg?.total ?? 0, count),
  }
})
