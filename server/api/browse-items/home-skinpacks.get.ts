// server/api/browse-items/home-skinpacks.get.ts
//
// The skinpacks the owner has flagged for the home page. Public and
// unauthenticated, and deliberately NOT the full /api/browse-items list:
// the home page is the heaviest page on a Worker already close to its CPU
// limit, so it reads the two or three rows it renders rather than the whole
// catalogue.
//
// Mirrors server/api/posts/home.get.ts, which feeds Premium Projects.

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const { results } = await db
    .prepare(
      `SELECT id, slug, title, image_url, category
       FROM browse_items
       WHERE section = 'skinpacks' AND featured_home = 1
       ORDER BY id ASC`
    )
    .all<{ id: number, slug: string, title: string, image_url: string, category: string }>()

  return results ?? []
})
