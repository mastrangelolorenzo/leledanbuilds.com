// server/api/admin/hero-backgrounds/order.put.ts
//
// Same contract as the taxonomy reorder: the FULL id list in its new order,
// so the request describes exactly what the operator saw rather than being
// interpreted against whatever the server currently believes.

import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ ids?: unknown }>(event)
  if (!Array.isArray(body?.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'ids must be a non-empty array.' })
  }

  const ids = body.ids.map((raw, i) => {
    const id = Number(raw)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, statusMessage: `ids[${i}] is not a valid id.` })
    }
    return id
  })

  if (new Set(ids).size !== ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'ids contains duplicates.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const { results: existing } = await db
    .prepare('SELECT id FROM hero_backgrounds')
    .all<{ id: number }>()

  const existingIds = new Set((existing ?? []).map(r => r.id))
  if (existingIds.size !== ids.length || !ids.every(id => existingIds.has(id))) {
    throw createError({
      statusCode: 409,
      statusMessage: 'The image list changed since this page was loaded. Reload and try again.',
    })
  }

  // One batch, so the list is never left half-reordered with two images
  // sharing a position.
  await db.batch(
    ids.map((id, index) =>
      db.prepare('UPDATE hero_backgrounds SET sort_order = ? WHERE id = ?').bind(index, id)
    )
  )

  return { reordered: ids.length }
})
