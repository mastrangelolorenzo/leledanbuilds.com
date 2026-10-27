import { requireAdmin } from '../../utils/requireAdmin'
import { slugify, isUniqueConstraintError, isValidPrice, isValidDownloadKey, isBrowseSection, BROWSE_SECTIONS } from '../../utils/postValidation'
import { findTaxonomyTerm } from '../../utils/taxonomy'

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
  download_key?: string | null
  section?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'id must be a valid integer.' })
  }

  const body = await readBody<UpdateBody>(event)
  if (!body.title || !body.image_url || !body.category || !body.released || !body.description || typeof body.price !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'title, image_url, price, category, released and description are required.' })
  }
  if (!isValidPrice(body.price)) {
    throw createError({ statusCode: 400, statusMessage: 'price must be a non-negative number with at most 2 decimal places.' })
  }
  const hasDownloadKey = !!body && typeof body === 'object' && 'download_key' in body
  if (hasDownloadKey && body.download_key != null && !isValidDownloadKey(body.download_key)) {
    throw createError({ statusCode: 400, statusMessage: 'download_key has an invalid format.' })
  }
  // Absent means "leave it alone" (COALESCE below), NOT "make it a build":
  // a client that does not send the field -- any older form, or a partial
  // edit -- would otherwise silently move every skinpack it saved into the
  // builds shop.
  const section = body.section ?? null
  if (section !== null && !isBrowseSection(section)) {
    throw createError({ statusCode: 400, statusMessage: `section must be one of: ${BROWSE_SECTIONS.join(', ')}.` })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  // Which fields apply depends on the section the row ENDS UP in, so an edit
  // that leaves the section alone has to read the row's own.
  const current = await db
    .prepare('SELECT section FROM browse_items WHERE id = ?')
    .bind(id)
    .first<{ section: string }>()
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  }
  const effectiveSection = section ?? (isBrowseSection(current.section) ? current.section : 'builds')
  const isSkinpack = effectiveSection === 'skinpacks'

  if (!isSkinpack && (!body.build_type || !body.theme)) {
    throw createError({ statusCode: 400, statusMessage: 'build_type and theme are required.' })
  }
  if (!isSkinpack && !DIFFICULTIES.includes(body.difficulty as typeof DIFFICULTIES[number])) {
    throw createError({ statusCode: 400, statusMessage: `difficulty must be one of: ${DIFFICULTIES.join(', ')}.` })
  }

  const slug = slugify(body.title)

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
        `UPDATE browse_items SET slug = ?, title = ?, image_url = ?, price = ?, difficulty = ?, build_type = ?, theme = ?, category = ?, released = ?, description = ?, section = COALESCE(?, section), download_key = CASE WHEN ? THEN ? ELSE download_key END, updated_at = ?
         WHERE id = ?`
      )
      .bind(slug, body.title, body.image_url, body.price, isSkinpack ? 'Easy' : body.difficulty, buildType, theme, category, body.released, body.description, section, hasDownloadKey ? 1 : 0, body.download_key ?? null, new Date().toISOString(), id)
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
