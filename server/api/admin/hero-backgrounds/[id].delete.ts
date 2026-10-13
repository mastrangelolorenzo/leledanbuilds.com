// server/api/admin/hero-backgrounds/[id].delete.ts

import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const row = await db
    .prepare('SELECT id FROM hero_backgrounds WHERE id = ?')
    .bind(id)
    .first<{ id: number }>()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  }

  // The last one cannot go: the hero would render with no background at
  // all, which looks like a broken page rather than a deliberate choice.
  const count = await db
    .prepare('SELECT COUNT(*) AS n FROM hero_backgrounds')
    .first<{ n: number }>()

  if ((count?.n ?? 0) <= 1) {
    throw createError({
      statusCode: 409,
      statusMessage: 'The home hero needs at least one background. Add another first.',
    })
  }

  await db.prepare('DELETE FROM hero_backgrounds WHERE id = ?').bind(id).run()

  // The uploaded file in R2 is deliberately left in place: the same image
  // may be a product or post image too, and deleting the object would break
  // those silently.
  return { deleted: true }
})
