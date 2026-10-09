// server/api/taxonomies.get.ts
//
// Public, unauthenticated: the ordered term lists the /browse filters are
// built from.
//
// Separate from /api/admin/taxonomies/* because that requires an admin
// session and returns usage counts and orphans -- operational detail that
// has no business on a public page. This returns names only, in the order
// the owner arranged them.

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  // One batch rather than three awaits: this runs on every browse page load
  // and three sequential round trips are noticeable on a cold Worker.
  const [buildTypes, themes, categories] = await db.batch([
    db.prepare('SELECT name FROM build_types ORDER BY sort_order ASC, name COLLATE NOCASE ASC'),
    db.prepare('SELECT name FROM themes ORDER BY sort_order ASC, name COLLATE NOCASE ASC'),
    db.prepare('SELECT name FROM categories ORDER BY sort_order ASC, name COLLATE NOCASE ASC'),
  ])

  const names = (r: unknown): string[] =>
    ((r as { results?: { name?: unknown }[] } | undefined)?.results ?? [])
      .map(row => row.name)
      .filter((n): n is string => typeof n === 'string')

  return {
    build_types: names(buildTypes),
    themes: names(themes),
    categories: names(categories),
  }
})
