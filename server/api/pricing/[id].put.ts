import { requireAdmin } from '../../utils/requireAdmin'
import { serializeFeatures } from '../../utils/pricingSerialization'

interface UpdateBody {
  title: string
  price: string
  subtitle?: string
  features?: string[]
  badge?: string | null
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'id must be a valid integer.' })
  }

  const body = await readBody<UpdateBody>(event)
  if (!body.title || !body.price) {
    throw createError({ statusCode: 400, statusMessage: 'title and price are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const result = await db
    .prepare('UPDATE pricing_plans SET title = ?, price = ?, subtitle = ?, features = ?, badge = ?, updated_at = ? WHERE id = ?')
    .bind(body.title, body.price, body.subtitle ?? '', serializeFeatures(body.features ?? []), body.badge ?? null, new Date().toISOString(), id)
    .run()

  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  }
  return { success: true }
})
