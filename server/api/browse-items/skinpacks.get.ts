// server/api/browse-items/skinpacks.get.ts
//
// Every skinpack, for the portfolio gallery on /skinpacks. Public and
// unauthenticated. Deliberately NOT /api/browse-items, which returns the
// whole shop catalogue with its prices and download keys: the portfolio
// needs four columns, and the Worker is close to its CPU limit.
//
// No featured flag here -- this is the full gallery, the same way
// /api/posts/portfolio is uncapped. featured_home still picks the shorter
// strip on the home page.

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const { results } = await db
    .prepare(
      `SELECT id, title, image_url, description
       FROM browse_items
       WHERE section = 'skinpacks'
       ORDER BY released DESC, id DESC`
    )
    .all<{ id: number, title: string, image_url: string, description: string }>()

  return results ?? []
})
