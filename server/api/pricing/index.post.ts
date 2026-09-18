import { requireAdmin } from '../../utils/requireAdmin'
import { serializeFeatures } from '../../utils/pricingSerialization'

interface CreateBody {
  title: string
  price: string
  subtitle?: string
  features?: string[]
  badge?: string | null
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<CreateBody>(event)

  if (!body.title || !body.price) {
    throw createError({ statusCode: 400, statusMessage: 'title and price are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const now = new Date().toISOString()
  const result = await db
    .prepare('INSERT INTO pricing_plans (title, price, subtitle, features, badge, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(body.title, body.price, body.subtitle ?? '', serializeFeatures(body.features ?? []), body.badge ?? null, now, now)
    .run()

  return { id: result.meta.last_row_id }
})
