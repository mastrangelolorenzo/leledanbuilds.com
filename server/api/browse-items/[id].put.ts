import { requireAdmin } from '../../utils/requireAdmin'
import { slugify, isUniqueConstraintError } from '../../utils/postValidation'
import { ensureTaxonomyTerm } from '../../utils/taxonomy'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'] as const

interface UpdateBody {
  title: string
  image_url: string
  price: number
  difficulty: string
  build_type: string
  theme: string
  category: string
  released: string
  description: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'id must be a valid integer.' })
  }

  const body = await readBody<UpdateBody>(event)
  if (!body.title || !body.image_url || !body.build_type || !body.theme || !body.category || !body.released || !body.description || typeof body.price !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'title, image_url, price, build_type, theme, category, released and description are required.' })
  }
  if (!DIFFICULTIES.includes(body.difficulty as typeof DIFFICULTIES[number])) {
    throw createError({ statusCode: 400, statusMessage: `difficulty must be one of: ${DIFFICULTIES.join(', ')}.` })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const slug = slugify(body.title)

  const buildType = await ensureTaxonomyTerm(db, 'build_types', body.build_type)
  const theme = await ensureTaxonomyTerm(db, 'themes', body.theme)
  const category = await ensureTaxonomyTerm(db, 'categories', body.category)

  try {
    const result = await db
      .prepare(
        `UPDATE browse_items SET slug = ?, title = ?, image_url = ?, price = ?, difficulty = ?, build_type = ?, theme = ?, category = ?, released = ?, description = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(slug, body.title, body.image_url, body.price, body.difficulty, buildType, theme, category, body.released, body.description, new Date().toISOString(), id)
      .run()

    if (result.meta.changes === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Not found.' })
    }
    return { success: true }
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw createError({ statusCode: 409, statusMessage: 'A browse item with this title (slug) already exists.' })
    }
    throw err
  }
})
