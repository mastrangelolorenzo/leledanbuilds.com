// server/api/browse-items/[id]/feature.patch.ts
//
// Shows or hides one item in the home page's skinpack section. Same shape as
// server/api/posts/[id]/feature.patch.ts, minus the list argument: a browse
// item has only the one home slot.
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'id must be a valid integer.' })
  }

  const body = await readBody<{ value?: unknown }>(event)
  if (typeof body?.value !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'value must be true or false.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const result = await db
    .prepare('UPDATE browse_items SET featured_home = ?, updated_at = ? WHERE id = ?')
    .bind(body.value ? 1 : 0, new Date().toISOString(), id)
    .run()

  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found.' })
  }

  return { success: true }
})
