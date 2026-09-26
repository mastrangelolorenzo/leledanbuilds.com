// server/api/difficulty-colors/[level].put.ts
//
// Admin only. Body: { color: string }. `color` is validated with strict
// 6-digit-hex matching (isValidHexColor) before it ever reaches the
// database -- this value is later interpolated into an inline `style`
// attribute on a public page (app/pages/browse/[slug].vue), so anything
// looser here would be a CSS/HTML injection vector, not just a data-quality
// concern.
import { requireAdmin } from '../../utils/requireAdmin'
import { isDifficultyLevel, isValidHexColor } from '../../utils/difficultyColors'

interface UpdateBody {
  color: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const level = getRouterParam(event, 'level')
  if (!isDifficultyLevel(level)) {
    throw createError({ statusCode: 400, statusMessage: 'level must be one of: Easy, Medium, Hard, Expert.' })
  }

  const body = await readBody<UpdateBody>(event)
  if (!isValidHexColor(body?.color)) {
    throw createError({ statusCode: 400, statusMessage: 'color must be a 6-digit hex colour, e.g. #22c55e.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const result = await db
    .prepare('UPDATE difficulty_colors SET color = ?, updated_at = ? WHERE level = ?')
    .bind(body.color, new Date().toISOString(), level)
    .run()

  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  }

  return { success: true }
})
