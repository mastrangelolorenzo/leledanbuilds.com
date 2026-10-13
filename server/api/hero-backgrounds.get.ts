// server/api/hero-backgrounds.get.ts
//
// Public: the home hero's rotating background images, in display order.
//
// Returns bare URLs rather than rows -- the home page needs nothing else,
// and ids and timestamps are admin detail.

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const { results } = await db
    .prepare('SELECT image_url FROM hero_backgrounds ORDER BY sort_order ASC, id ASC')
    .all<{ image_url: string }>()

  return (results ?? [])
    .map(r => r.image_url)
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
})
