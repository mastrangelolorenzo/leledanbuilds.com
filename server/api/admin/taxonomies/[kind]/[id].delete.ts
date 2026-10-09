// server/api/admin/taxonomies/[kind]/[id].delete.ts
//
// Removes a term, but refuses while products still use it.
//
// Refusing rather than cascading is deliberate: browse_items stores the term
// as text with no foreign key, so a cascade would have to either blank the
// field on real products or delete the products themselves. Neither is a
// decision a delete button should make silently. The error names the count
// so the operator knows what to reassign first.

import { requireAdmin } from '../../../../utils/requireAdmin'
import { resolveTaxonomy } from '../../../../utils/taxonomy'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const taxonomy = resolveTaxonomy(getRouterParam(event, 'kind'))
  if (!taxonomy) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown taxonomy.' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid term id.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const term = await db
    .prepare(`SELECT id, name FROM ${taxonomy.table} WHERE id = ?`)
    .bind(id)
    .first<{ id: number, name: string }>()

  if (!term) {
    throw createError({ statusCode: 404, statusMessage: 'Term not found.' })
  }

  const inUse = await db
    .prepare(`SELECT COUNT(*) AS n FROM browse_items WHERE ${taxonomy.itemColumn} = ? COLLATE NOCASE`)
    .bind(term.name)
    .first<{ n: number }>()

  const count = inUse?.n ?? 0
  if (count > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `"${term.name}" is used by ${count} build${count === 1 ? '' : 's'}. Change those first.`,
    })
  }

  await db.prepare(`DELETE FROM ${taxonomy.table} WHERE id = ?`).bind(id).run()

  return { deleted: true, name: term.name }
})
