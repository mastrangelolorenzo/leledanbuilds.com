// server/api/admin/taxonomies/[kind]/[id].patch.ts
//
// Renames a term, and renames it on every product that uses it.
//
// Both halves are required. browse_items stores the term as TEXT, not as a
// foreign key, so renaming only the taxonomy row would leave every product
// pointing at a name that no longer exists -- they would vanish from the
// filters and their dropdown would show a value the list does not contain.

import { requireAdmin } from '../../../../utils/requireAdmin'
import { resolveTaxonomy, normalizeTermName, MAX_TERM_LENGTH } from '../../../../utils/taxonomy'
import { parseTags, serializeTags } from '../../../../utils/browseTags'

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

  const body = await readBody<{ name?: unknown }>(event)
  const newName = normalizeTermName(body?.name)
  if (!newName) {
    throw createError({
      statusCode: 400,
      statusMessage: `Name is required and must be ${MAX_TERM_LENGTH} characters or fewer.`,
    })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const current = await db
    .prepare(`SELECT id, name FROM ${taxonomy.table} WHERE id = ?`)
    .bind(id)
    .first<{ id: number, name: string }>()

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Term not found.' })
  }

  // A pure case change ("modern" -> "Modern") must be allowed: it collides
  // with itself under COLLATE NOCASE, so the clash check has to exclude this
  // row rather than simply looking the name up.
  const clash = await db
    .prepare(`SELECT name FROM ${taxonomy.table} WHERE name = ? COLLATE NOCASE AND id != ?`)
    .bind(newName, id)
    .first<{ name: string }>()

  if (clash) {
    throw createError({ statusCode: 409, statusMessage: `"${clash.name}" already exists.` })
  }

  if (current.name === newName) {
    return { id, name: newName, products_updated: 0 }
  }

  // The column holds a JSON list (migration 0023), so the rename has to
  // replace ONE element of each list and leave the others alone -- a plain
  // UPDATE ... SET col = ? would overwrite every other tag on the product.
  // The rows are read first and rewritten here rather than in SQL, which has
  // no clean way to swap a value inside a JSON array.
  const { results: affected } = await db
    .prepare(`
      SELECT b.id, b.${taxonomy.itemColumn} AS tags FROM browse_items b
      WHERE b.section = '${taxonomy.section}'
        AND EXISTS (
          SELECT 1 FROM json_each(b.${taxonomy.itemColumn}) je
          WHERE je.value = ? COLLATE NOCASE
        )
    `)
    .bind(current.name)
    .all<{ id: number, tags: string }>()

  const lowered = current.name.toLowerCase()
  const rewrites = (affected ?? []).map((row) => {
    const renamed = parseTags(row.tags).map((tag) => (tag.toLowerCase() === lowered ? newName : tag))
    // A product already carrying the destination name would end up with it
    // twice, so collapse duplicates while the list is in hand.
    const deduped = renamed.filter((tag, i) => renamed.indexOf(tag) === i)
    return db
      .prepare(`UPDATE browse_items SET ${taxonomy.itemColumn} = ? WHERE id = ?`)
      .bind(serializeTags(deduped), row.id)
  })

  // batch() so the writes land together: a rename that updated the term but
  // not the products (or the reverse) is exactly the inconsistency this
  // endpoint exists to avoid.
  await db.batch([
    db.prepare(`UPDATE ${taxonomy.table} SET name = ? WHERE id = ?`).bind(newName, id),
    ...rewrites,
  ])

  return {
    id,
    name: newName,
    products_updated: rewrites.length,
  }
})
