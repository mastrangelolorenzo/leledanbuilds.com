import { parseFeatures } from '../../utils/pricingSerialization'

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  const { results } = await db
    .prepare('SELECT id, title, price, subtitle, features, badge FROM pricing_plans ORDER BY id ASC')
    .all<{ id: number, title: string, price: string, subtitle: string, features: string, badge: string | null }>()

  return results.map(row => ({ ...row, features: parseFeatures(row.features) }))
})
