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

  const result = await db.prepare('DELETE FROM browse_items WHERE id = ?').bind(id).run()
  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  }
  return { success: true }
})
