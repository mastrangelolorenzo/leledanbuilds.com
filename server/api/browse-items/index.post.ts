import { requireAdmin } from '../../utils/requireAdmin'
import { slugify, isUniqueConstraintError, isValidPrice, isValidDownloadKey, isBrowseSection, BROWSE_SECTIONS } from '../../utils/postValidation'
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
  section?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<CreateBody>(event)

  // Defaults to 'builds' so an older client that does not send the field
  // keeps creating builds, exactly as before.
  const section = body.section ?? 'builds'
  if (!isBrowseSection(section)) {
    throw createError({ statusCode: 400, statusMessage: `section must be one of: ${BROWSE_SECTIONS.join(', ')}.` })
  }
  const isSkinpack = section === 'skinpacks'

  if (!body.title || !body.image_url || !body.category || !body.released || !body.description || typeof body.price !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'title, image_url, price, category, released and description are required.' })
  }
  if (!isSkinpack && (!body.build_type || !body.theme)) {
    throw createError({ statusCode: 400, statusMessage: 'build_type and theme are required.' })
  }
  if (!isValidPrice(body.price)) {
    throw createError({ statusCode: 400, statusMessage: 'price must be a non-negative number with at most 2 decimal places.' })
  }
  if (body.download_key != null && !isValidDownloadKey(body.download_key)) {
    throw createError({ statusCode: 400, statusMessage: 'download_key has an invalid format.' })
  }

  if (!isSkinpack && !DIFFICULTIES.includes(body.difficulty as typeof DIFFICULTIES[number])) {
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
  // A skinpack has no build type, theme or difficulty -- "Structures",
  // "Fantasy" and "Medium" describe builds -- and its categories come from
  // their own list. build_type and theme are stored empty; difficulty gets
  // 'Easy' only because the column carries a CHECK that allows nothing else,
  // and nothing on a skinpack ever reads it.
  const buildType = isSkinpack ? '' : await findTaxonomyTerm(db, 'build_types', body.build_type)
  const theme = isSkinpack ? '' : await findTaxonomyTerm(db, 'themes', body.theme)
  const category = await findTaxonomyTerm(db, isSkinpack ? 'skinpack_categories' : 'categories', body.category)

  const unknown = [
    ...(isSkinpack ? [] : [
      ['Build type', buildType, body.build_type],
      ['Theme', theme, body.theme],
    ]),
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
        `INSERT INTO browse_items (slug, title, image_url, price, difficulty, build_type, theme, category, released, description, download_key, section, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(slug, body.title, body.image_url, body.price, isSkinpack ? 'Easy' : body.difficulty, buildType, theme, category, body.released, body.description, body.download_key ?? null, section, now, now)
      .run()

    return { id: result.meta.last_row_id }
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw createError({ statusCode: 409, statusMessage: 'A browse item with this title (slug) already exists.' })
    }
    throw err
  }
})
