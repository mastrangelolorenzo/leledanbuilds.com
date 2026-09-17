import { requireAdmin } from '../../utils/requireAdmin'
import { slugify, assertFeatureLimit, isUniqueConstraintError } from '../../utils/postValidation'

interface CreatePostBody {
  title: string
  image_url: string
  teaser: string
  description: string
  featured_home?: boolean
  featured_portfolio?: boolean
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<CreatePostBody>(event)

  if (!body.title || !body.image_url || !body.teaser || !body.description) {
    throw createError({ statusCode: 400, statusMessage: 'title, image_url, teaser and description are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const featuredHome = body.featured_home ? 1 : 0
  const featuredPortfolio = body.featured_portfolio ? 1 : 0

  if (featuredHome) await assertFeatureLimit(db, 'home', null)
  if (featuredPortfolio) await assertFeatureLimit(db, 'portfolio', null)

  const slug = slugify(body.title)
  const now = new Date().toISOString()

  let result
  try {
    result = await db
      .prepare(
        `INSERT INTO posts (title, slug, image_url, teaser, description, featured_home, featured_portfolio, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(body.title, slug, body.image_url, body.teaser, body.description, featuredHome, featuredPortfolio, now, now)
      .run()
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw createError({ statusCode: 409, statusMessage: 'A post with this title already exists.' })
    }
    throw err
  }

  return { id: result.meta.last_row_id }
})
