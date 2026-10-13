// server/api/admin/hero-backgrounds/index.get.ts

import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const { results } = await db
    .prepare('SELECT id, image_url, sort_order FROM hero_backgrounds ORDER BY sort_order ASC, id ASC')
    .all<{ id: number, image_url: string, sort_order: number }>()

  return results ?? []
})
