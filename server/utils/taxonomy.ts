interface TaxonomyDb {
  prepare: (sql: string) => {
    bind: (...args: unknown[]) => { first: <T>() => Promise<T | null>, run: () => Promise<unknown> }
  }
}

const ALLOWED_TABLES = ['build_types', 'themes', 'categories'] as const
export type TaxonomyTable = typeof ALLOWED_TABLES[number]

/**
 * The three taxonomies, keyed by the slug used in the admin URLs.
 *
 * `table` and `itemColumn` are looked up from THIS map and never taken from
 * a request: both are interpolated into SQL (SQLite cannot parameterise an
 * identifier), so a request-supplied value would be a straight injection.
 * Everything reaching the database goes through resolveTaxonomy below.
 */
export const TAXONOMIES = {
  categories: { table: 'categories', itemColumn: 'category', label: 'Category' },
  themes: { table: 'themes', itemColumn: 'theme', label: 'Theme' },
  'build-types': { table: 'build_types', itemColumn: 'build_type', label: 'Build type' },
} as const satisfies Record<string, { table: TaxonomyTable, itemColumn: string, label: string }>

export type TaxonomyKind = keyof typeof TAXONOMIES

export function isTaxonomyKind(value: unknown): value is TaxonomyKind {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(TAXONOMIES, value)
}

export function resolveTaxonomy(kind: unknown) {
  if (!isTaxonomyKind(kind)) return null
  return TAXONOMIES[kind]
}

export const MAX_TERM_LENGTH = 60

/**
 * Validates a term name for storage. Returns the trimmed value, or null when
 * it is unusable.
 *
 * Deliberately narrow: these names are rendered on public product pages and
 * used as filter values in URLs, and the whole point of moving to a managed
 * list is that terms stop being whatever someone typed.
 */
export function normalizeTermName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  // Collapse internal runs of whitespace too, so "Modern  House" and
  // "Modern House" cannot both exist and look identical in a dropdown.
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (trimmed.length === 0 || trimmed.length > MAX_TERM_LENGTH) return null
  // No control characters.
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return null
  return trimmed
}

/**
 * Returns the stored spelling of `name` in `table`, or null if it is not a
 * known term.
 *
 * This replaces the old ensureTaxonomyTerm, which CREATED the term when it
 * did not exist. That was how free-text categories got in: every typo in the
 * product form silently became a new permanent category. Terms are now
 * managed from the taxonomy admin and products may only reference existing
 * ones.
 *
 * Returning the stored spelling (rather than the caller's) is what keeps
 * "modern" and "Modern" from both appearing on the public site: the lookup
 * is case-insensitive, the value written to browse_items is canonical.
 */
export async function findTaxonomyTerm(
  db: TaxonomyDb,
  table: TaxonomyTable,
  name: string
): Promise<string | null> {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Invalid taxonomy table: ${table}`)
  }
  const trimmed = normalizeTermName(name)
  if (!trimmed) return null

  const existing = await db
    .prepare(`SELECT name FROM ${table} WHERE name = ? COLLATE NOCASE`)
    .bind(trimmed)
    .first<{ name: string }>()

  return existing ? existing.name : null
}
