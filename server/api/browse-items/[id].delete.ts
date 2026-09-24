import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'id must be a valid integer.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  // A completed order is a buyer's paid-for access to this item's file
  // (server/api/downloads/[browseItemId].get.ts looks it up by
  // browse_item_id). Deleting the row out from under it would either make
  // that purchase silently vanish from /api/my-orders (its INNER JOIN would
  // just drop the row) or 404 on download -- or, since orders.browse_item_id
  // REFERENCES browse_items(id), fail with an opaque foreign-key 500 with no
  // explanation for the admin. Refuse up front instead, with a clear reason.
  const purchased = await db
    .prepare(`SELECT COUNT(*) as count FROM orders WHERE browse_item_id = ? AND status = 'completed'`)
    .bind(id)
    .first<{ count: number }>()

  if ((purchased?.count ?? 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `This item has ${purchased!.count} completed purchase(s) and cannot be deleted — buyers would lose access to their download.`,
    })
  }

  const result = await db.prepare('DELETE FROM browse_items WHERE id = ?').bind(id).run()
  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  }
  return { success: true }
})
