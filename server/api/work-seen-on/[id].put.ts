import { requireAdmin } from '../../utils/requireAdmin'

interface UpdateBody {
  name: string
  image_url: string
  counter?: string
  link?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'id must be a valid integer.' })
  }

  const body = await readBody<UpdateBody>(event)
  if (!body.name || !body.image_url) {
    throw createError({ statusCode: 400, statusMessage: 'name and image_url are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const result = await db
    .prepare('UPDATE work_seen_on SET name = ?, image_url = ?, counter = ?, link = ?, updated_at = ? WHERE id = ?')
    .bind(body.name, body.image_url, body.counter ?? '', body.link ?? '#', new Date().toISOString(), id)
    .run()

  if (result.meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  }
  return { success: true }
})
