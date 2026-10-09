// server/api/admin/taxonomies/[kind]/index.post.ts
//
// Adds a term. This is now the ONLY way a term comes into existence --
// saving a product no longer creates one implicitly, which is how typos
// used to become permanent categories.

import { requireAdmin } from '../../../../utils/requireAdmin'
import { resolveTaxonomy, normalizeTermName, MAX_TERM_LENGTH } from '../../../../utils/taxonomy'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const taxonomy = resolveTaxonomy(getRouterParam(event, 'kind'))
  if (!taxonomy) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown taxonomy.' })
  }

  const body = await readBody<{ name?: unknown }>(event)
  const name = normalizeTermName(body?.name)
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: `Name is required and must be ${MAX_TERM_LENGTH} characters or fewer.`,
    })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  // Checked before inserting so the conflict can be reported in the term's
  // stored spelling ("Modern already exists" rather than a bare constraint
  // error on "modern"). The UNIQUE ... COLLATE NOCASE index is still the
  // real guarantee -- this is the message, not the enforcement.
  const existing = await db
    .prepare(`SELECT name FROM ${taxonomy.table} WHERE name = ? COLLATE NOCASE`)
    .bind(name)
    .first<{ name: string }>()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: `"${existing.name}" already exists.` })
  }

  const result = await db
    .prepare(`INSERT INTO ${taxonomy.table} (name) VALUES (?)`)
    .bind(name)
    .run()

  return { id: result.meta?.last_row_id, name, usage_count: 0 }
})
