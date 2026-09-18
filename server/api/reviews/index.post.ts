import { requireAdmin } from '../../utils/requireAdmin'

interface CreateBody {
  name: string
  image_url: string
  detail: string
  counter?: string
  link?: string
  review: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<CreateBody>(event)

  if (!body.name || !body.image_url || !body.detail || !body.review) {
    throw createError({ statusCode: 400, statusMessage: 'name, image_url, detail and review are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const now = new Date().toISOString()
  const result = await db
    .prepare('INSERT INTO reviews (name, image_url, detail, counter, link, review, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(body.name, body.image_url, body.detail, body.counter || '', body.link || '#', body.review, now, now)
    .run()

  return { id: result.meta.last_row_id }
})
