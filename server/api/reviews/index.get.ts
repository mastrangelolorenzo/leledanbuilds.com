export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  const { results } = await db.prepare('SELECT id, name, image_url, detail, counter, link, review FROM reviews ORDER BY id ASC').all()
  return results
})
