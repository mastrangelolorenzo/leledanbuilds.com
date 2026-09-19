export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  const { results } = await db
    .prepare('SELECT id, slug, title, image_url, price, difficulty, build_type, theme, category, released, description FROM browse_items ORDER BY id ASC')
    .all()
  return results
})
