// server/api/difficulty-colors/index.get.ts
//
// Public: browse/[slug].vue (and any other public page) needs these to
// colour the difficulty dots, so this must never require auth.
import { DIFFICULTY_LEVELS } from '../../utils/difficultyColors'

interface ColorRow {
  level: string
  color: string
}

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const { results } = await db
    .prepare('SELECT level, color FROM difficulty_colors')
    .all<ColorRow>()

  const byLevel = new Map(results.map((row) => [row.level, row.color]))

  // Always return all four keys, even if a row is somehow missing, so a
  // caller can index this map by level without an extra existence check.
  const colors: Record<string, string | null> = {}
  for (const level of DIFFICULTY_LEVELS) {
    colors[level] = byLevel.get(level) ?? null
  }
  return colors
})
