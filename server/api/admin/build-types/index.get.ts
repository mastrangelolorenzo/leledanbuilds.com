import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  const { results } = await db.prepare('SELECT name FROM build_types ORDER BY name ASC').all<{ name: string }>()
  return results.map(r => r.name)
})
