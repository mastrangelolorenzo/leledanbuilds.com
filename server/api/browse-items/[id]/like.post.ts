// server/api/browse-items/[id]/like.post.ts
//
// Toggles the current user's like on a browse item. A user can like an item
// once; clicking again removes it. The unique index on
// browse_item_likes(user_id, browse_item_id) (see
// server/database/migrations/0013_create_browse_item_likes.sql) is what
// actually makes a double-like impossible -- the SELECT-then-INSERT below is
// just the common case, and a racing duplicate insert that slips past it is
// caught and treated as "already liked" rather than surfaced as a 500.
import { requireAuth } from '../../../utils/requireAuth'
import { isUniqueConstraintError } from '../../../utils/postValidation'

interface CountRow {
  count: number
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'id must be a valid integer.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const item = await db.prepare('SELECT id FROM browse_items WHERE id = ?').bind(id).first<{ id: number }>()
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found.' })
  }

  const existing = await db
    .prepare('SELECT id FROM browse_item_likes WHERE user_id = ? AND browse_item_id = ?')
    .bind(session.userId, id)
    .first<{ id: number }>()

  let liked: boolean

  if (existing) {
    await db.prepare('DELETE FROM browse_item_likes WHERE id = ?').bind(existing.id).run()
    liked = false
  } else {
    try {
      await db
        .prepare('INSERT INTO browse_item_likes (user_id, browse_item_id) VALUES (?, ?)')
        .bind(session.userId, id)
        .run()
      liked = true
    } catch (err) {
      // A second request from the same user (double-click, retry, two tabs)
      // can race this one between the SELECT above and this INSERT. The
      // unique index rejects the second insert -- that's a success from the
      // caller's point of view (the end state they wanted, "liked", is
      // true), not a server error.
      if (isUniqueConstraintError(err)) {
        liked = true
      } else {
        throw err
      }
    }
  }

  const countRow = await db
    .prepare('SELECT COUNT(*) as count FROM browse_item_likes WHERE browse_item_id = ?')
    .bind(id)
    .first<CountRow>()

  return { liked, like_count: countRow?.count ?? 0 }
})
