import { requireAdmin } from '../../utils/requireAdmin'
import { slugify, isUniqueConstraintError, isValidPrice, isValidDownloadKey, isBrowseSection, BROWSE_SECTIONS } from '../../utils/postValidation'
import { resolveTagFields } from '../../utils/taxonomy'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'] as const

interface UpdateBody {
  title: string
  image_url: string
  price: number
  difficulty: string
  // One or more terms each. Sent as an array by the admin form; a single
  // string from an older one is still read (see toTagList).
  build_type: string[] | string
  theme: string[] | string
  category: string[] | string
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
  // The tag fields are checked by resolveTagFields below, which knows they
  // are lists -- `!body.category` would be false for an empty array.
  if (!body.title || !body.image_url || !body.released || !body.description || typeof body.price !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'title, image_url, price, released and description are required.' })
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

  if (!isSkinpack && !DIFFICULTIES.includes(body.difficulty as typeof DIFFICULTIES[number])) {
    throw createError({ statusCode: 400, statusMessage: `difficulty must be one of: ${DIFFICULTIES.join(', ')}.` })
  }

  const slug = slugify(body.title)

  // Terms must already exist: the taxonomy admin is the only place they are
  // created, so a typo in the product form is a 400 and not a new permanent
  // category. resolveTagFields also enforces "at least one of each" and
  // drops build type/theme for a skinpack -- difficulty gets 'Easy' below
  // only because the column carries a CHECK that allows nothing else, and
  // nothing on a skinpack ever reads it.
  const tags = await resolveTagFields(db, {
    isSkinpack,
    build_type: body.build_type,
    theme: body.theme,
    category: body.category,
  })

  try {
    const result = await db
      .prepare(
        `UPDATE browse_items SET slug = ?, title = ?, image_url = ?, price = ?, difficulty = ?, build_type = ?, theme = ?, category = ?, released = ?, description = ?, section = COALESCE(?, section), download_key = CASE WHEN ? THEN ? ELSE download_key END, updated_at = ?
         WHERE id = ?`
      )
      .bind(slug, body.title, body.image_url, body.price, isSkinpack ? 'Easy' : body.difficulty, tags.build_type, tags.theme, tags.category, body.released, body.description, section, hasDownloadKey ? 1 : 0, body.download_key ?? null, new Date().toISOString(), id)
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
