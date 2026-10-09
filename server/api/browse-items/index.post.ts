import { requireAdmin } from '../../utils/requireAdmin'
import { slugify, isUniqueConstraintError, isValidPrice, isValidDownloadKey } from '../../utils/postValidation'
import { findTaxonomyTerm } from '../../utils/taxonomy'

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

  // Terms must already exist: the taxonomy admin is the only place they are
  // created. Previously this called ensureTaxonomyTerm, which INSERTED an
  // unknown term -- that is how every typo in the product form became a
  // permanent category. A 400 here is the point, not an inconvenience.
  const buildType = await findTaxonomyTerm(db, 'build_types', body.build_type)
  const theme = await findTaxonomyTerm(db, 'themes', body.theme)
  const category = await findTaxonomyTerm(db, 'categories', body.category)

  const unknown = [
    ['Build type', buildType, body.build_type],
    ['Theme', theme, body.theme],
    ['Category', category, body.category],
  ].filter(([, resolved]) => !resolved)

  if (unknown.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: unknown
        .map(([label, , given]) => `${label} "${given}" is not in the list. Add it under Taxonomies first.`)
        .join(' '),
    })
  }

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
