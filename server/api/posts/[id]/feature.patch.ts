import { requireAdmin } from '../../../utils/requireAdmin'
import { assertFeatureLimit } from '../../../utils/postValidation'

interface FeatureBody {
  list: 'home' | 'portfolio'
  value: boolean
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'id must be a valid integer.' })
  }
  const body = await readBody<FeatureBody>(event)

  if (body.list !== 'home' && body.list !== 'portfolio') {
    throw createError({ statusCode: 400, statusMessage: 'list must be "home" or "portfolio".' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const column = body.list === 'home' ? 'featured_home' : 'featured_portfolio'

  if (body.value) {
    await assertFeatureLimit(db, body.list, id)
  }

  const result = await db
    .prepare(`UPDATE posts SET ${column} = ?, updated_at = ? WHERE id = ?`)
    .bind(body.value ? 1 : 0, new Date().toISOString(), id)
    .run()

  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found.' })
  }

  return { success: true }
})
