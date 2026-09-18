import { requireAdmin } from '../../utils/requireAdmin'

interface CreateBody {
  name: string
  image_url: string
  counter?: string
  link?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<CreateBody>(event)

  if (!body.name || !body.image_url) {
    throw createError({ statusCode: 400, statusMessage: 'name and image_url are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const now = new Date().toISOString()
  const result = await db
    .prepare('INSERT INTO work_seen_on (name, image_url, counter, link, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(body.name, body.image_url, body.counter ?? '', body.link ?? '#', now, now)
    .run()

  return { id: result.meta.last_row_id }
})
