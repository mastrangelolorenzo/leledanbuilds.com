import { requireAdmin } from '../../utils/requireAdmin'
import { slugify, isUniqueConstraintError, isValidPrice, isValidDownloadKey, isBrowseSection, BROWSE_SECTIONS } from '../../utils/postValidation'
import { resolveTagFields } from '../../utils/taxonomy'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'] as const

interface CreateBody {
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
  const body = await readBody<CreateBody>(event)

  // Defaults to 'builds' so an older client that does not send the field
  // keeps creating builds, exactly as before.
  const section = body.section ?? 'builds'
  if (!isBrowseSection(section)) {
    throw createError({ statusCode: 400, statusMessage: `section must be one of: ${BROWSE_SECTIONS.join(', ')}.` })
  }
  const isSkinpack = section === 'skinpacks'

  // The tag fields are checked by resolveTagFields below, which knows they
  // are lists -- `!body.category` would be false for an empty array.
  if (!body.title || !body.image_url || !body.released || !body.description || typeof body.price !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'title, image_url, price, released and description are required.' })
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
        `INSERT INTO browse_items (slug, title, image_url, price, difficulty, build_type, theme, category, released, description, download_key, section, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(slug, body.title, body.image_url, body.price, isSkinpack ? 'Easy' : body.difficulty, tags.build_type, tags.theme, tags.category, body.released, body.description, body.download_key ?? null, section, now, now)
      .run()

    return { id: result.meta.last_row_id }
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw createError({ statusCode: 409, statusMessage: 'A browse item with this title (slug) already exists.' })
    }
    throw err
  }
})
