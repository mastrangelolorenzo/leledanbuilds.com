// server/api/admin/taxonomies/[kind]/order.put.ts
//
// Persists the order produced by dragging the terms around in the admin.
//
// Takes the FULL list of ids in their new order rather than a single
// "move id X to position N": a partial move has to be interpreted against
// whatever the server currently believes the order is, and two admins (or
// two tabs) dragging at once would interleave into something neither
// intended. Sending the whole list makes the request self-describing -- the
// result is exactly what the operator saw on screen.

import { requireAdmin } from '../../../../utils/requireAdmin'
import { resolveTaxonomy } from '../../../../utils/taxonomy'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const taxonomy = resolveTaxonomy(getRouterParam(event, 'kind'))
  if (!taxonomy) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown taxonomy.' })
  }

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

  // The submitted list must be exactly the stored set. A list missing a term
  // would leave that term stranded at its old position -- quietly colliding
  // with whatever now occupies it -- and a list naming a term from another
  // taxonomy would silently do nothing. Both are better as a 409 telling the
  // operator their page is stale.
  const { results: existing } = await db
    .prepare(`SELECT id FROM ${taxonomy.table}`)
    .all<{ id: number }>()

  const existingIds = new Set((existing ?? []).map(r => r.id))
  const sameSize = existingIds.size === ids.length
  const allKnown = ids.every(id => existingIds.has(id))

  if (!sameSize || !allKnown) {
    throw createError({
      statusCode: 409,
      statusMessage: 'The term list changed since this page was loaded. Reload and try again.',
    })
  }

  // One batch so the list is never half-reordered: a partial write would
  // leave two terms sharing a position, and the displayed order would then
  // depend on the storage engine's tie-breaking.
  await db.batch(
    ids.map((id, index) =>
      db.prepare(`UPDATE ${taxonomy.table} SET sort_order = ? WHERE id = ?`).bind(index, id)
    )
  )

  return { reordered: ids.length }
})
