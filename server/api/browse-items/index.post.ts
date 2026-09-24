import { requireAdmin } from '../../utils/requireAdmin'
import { slugify, isUniqueConstraintError, isValidPrice, isValidDownloadKey } from '../../utils/postValidation'
import { ensureTaxonomyTerm } from '../../utils/taxonomy'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'] as const

interface CreateBody {
  title: string
  image_url: string
  price: number
  difficulty: string
  build_type: string
  theme: string
  category: string
  released: string
  description: string
  download_key?: string | null
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<CreateBody>(event)

  if (!body.title || !body.image_url || !body.build_type || !body.theme || !body.category || !body.released || !body.description || typeof body.price !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'title, image_url, price, build_type, theme, category, released and description are required.' })
  }
  if (!isValidPrice(body.price)) {
    throw createError({ statusCode: 400, statusMessage: 'price must be a non-negative number with at most 2 decimal places.' })
  }
  if (body.download_key != null && !isValidDownloadKey(body.download_key)) {
    throw createError({ statusCode: 400, statusMessage: 'download_key has an invalid format.' })
  }
  if (!DIFFICULTIES.includes(body.difficulty as typeof DIFFICULTIES[number])) {
    throw createError({ statusCode: 400, statusMessage: `difficulty must be one of: ${DIFFICULTIES.join(', ')}.` })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const slug = slugify(body.title)
  const now = new Date().toISOString()

  const buildType = await ensureTaxonomyTerm(db, 'build_types', body.build_type)
  const theme = await ensureTaxonomyTerm(db, 'themes', body.theme)
  const category = await ensureTaxonomyTerm(db, 'categories', body.category)

  try {
    const result = await db
      .prepare(
        `INSERT INTO browse_items (slug, title, image_url, price, difficulty, build_type, theme, category, released, description, download_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(slug, body.title, body.image_url, body.price, body.difficulty, buildType, theme, category, body.released, body.description, body.download_key ?? null, now, now)
      .run()

    return { id: result.meta.last_row_id }
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw createError({ statusCode: 409, statusMessage: 'A browse item with this title (slug) already exists.' })
    }
    throw err
  }
})
