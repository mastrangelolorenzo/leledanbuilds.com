import { requireAdmin } from '../../utils/requireAdmin'
import { slugify, assertFeatureLimit } from '../../utils/postValidation'

interface UpdatePostBody {
  title: string
  image_url: string
  teaser: string
  description: string
  featured_home?: boolean
  featured_portfolio?: boolean
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<UpdatePostBody>(event)

  if (!body.title || !body.image_url || !body.teaser || !body.description) {
    throw createError({ statusCode: 400, statusMessage: 'title, image_url, teaser and description are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const featuredHome = body.featured_home ? 1 : 0
  const featuredPortfolio = body.featured_portfolio ? 1 : 0

  if (featuredHome) await assertFeatureLimit(db, 'home', id)
  if (featuredPortfolio) await assertFeatureLimit(db, 'portfolio', id)

  const slug = slugify(body.title)
  const now = new Date().toISOString()

  await db
    .prepare(
      `UPDATE posts SET title = ?, slug = ?, image_url = ?, teaser = ?, description = ?, featured_home = ?, featured_portfolio = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(body.title, slug, body.image_url, body.teaser, body.description, featuredHome, featuredPortfolio, now, id)
    .run()

  return { success: true }
})
