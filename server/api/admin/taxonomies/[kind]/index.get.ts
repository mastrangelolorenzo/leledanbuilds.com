// server/api/admin/taxonomies/[kind]/index.get.ts
//
// Lists the terms of one taxonomy with how many products use each, which is
// what makes the delete button safe to offer: an operator can see that
// "Medieval" is on 12 builds before trying to remove it.

import { requireAdmin } from '../../../../utils/requireAdmin'
import { resolveTaxonomy } from '../../../../utils/taxonomy'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  // table/itemColumn come from the allow-list in utils/taxonomy, never from
  // the URL: both are interpolated into SQL below because SQLite cannot
  // parameterise an identifier.
  const taxonomy = resolveTaxonomy(getRouterParam(event, 'kind'))
  if (!taxonomy) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown taxonomy.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  // LEFT JOIN on the NAME, not on an id: browse_items stores the term as
  // text (that is the existing schema), so the join key is the string.
  // COLLATE NOCASE matches how the terms are looked up everywhere else.
  const { results } = await db
    .prepare(`
      SELECT t.id, t.name, t.sort_order, COUNT(b.id) AS usage_count
      FROM ${taxonomy.table} t
      LEFT JOIN browse_items b ON b.${taxonomy.itemColumn} = t.name COLLATE NOCASE
      GROUP BY t.id, t.name, t.sort_order
      -- sort_order is the operator's drag order (migration 0017); name is
      -- only the tie-break, so two terms that somehow share a position still
      -- come back in a stable sequence rather than an arbitrary one.
      ORDER BY t.sort_order ASC, t.name COLLATE NOCASE ASC
    `)
    .all<{ id: number, name: string, sort_order: number, usage_count: number }>()

  // Terms used by a product but missing from the list: these exist because
  // the product form used to create terms implicitly from free text. They
  // are surfaced so the operator can see and fix them rather than wondering
  // why a product shows a category the list does not contain.
  const { results: orphans } = await db
    .prepare(`
      SELECT DISTINCT b.${taxonomy.itemColumn} AS name, COUNT(*) AS usage_count
      FROM browse_items b
      WHERE b.${taxonomy.itemColumn} IS NOT NULL
        AND b.${taxonomy.itemColumn} != ''
        AND NOT EXISTS (
          SELECT 1 FROM ${taxonomy.table} t WHERE t.name = b.${taxonomy.itemColumn} COLLATE NOCASE
        )
      GROUP BY b.${taxonomy.itemColumn}
      ORDER BY name COLLATE NOCASE ASC
    `)
    .all<{ name: string, usage_count: number }>()

  return {
    kind: getRouterParam(event, 'kind'),
    label: taxonomy.label,
    terms: results ?? [],
    orphans: orphans ?? [],
  }
})
