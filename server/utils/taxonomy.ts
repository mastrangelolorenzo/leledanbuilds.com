import type { BrowseSection } from './postValidation'
import { serializeTags, toTagList } from './browseTags'

interface TaxonomyDb {
  prepare: (sql: string) => {
    bind: (...args: unknown[]) => { first: <T>() => Promise<T | null>, run: () => Promise<unknown> }
  }
}

const ALLOWED_TABLES = ['build_types', 'themes', 'categories', 'skinpack_categories'] as const
export type TaxonomyTable = typeof ALLOWED_TABLES[number]

/**
 * The managed taxonomies, keyed by the slug used in the admin URLs.
 *
 * `table`, `itemColumn` and `section` are looked up from THIS map and never
 * taken from a request: all three are interpolated into SQL (SQLite cannot
 * parameterise an identifier), so a request-supplied value would be a
 * straight injection. Everything reaching the database goes through
 * resolveTaxonomy below.
 *
 * `section` is which catalogue the terms belong to. Skinpacks have their own
 * category list -- the builds terms describe builds -- so two entries share
 * the `category` column and are told apart by this field alone, which is why
 * every usage count and delete guard has to filter on it.
 */
export const TAXONOMIES = {
  categories: { table: 'categories', itemColumn: 'category', label: 'Category', section: 'builds' },
  themes: { table: 'themes', itemColumn: 'theme', label: 'Theme', section: 'builds' },
  'build-types': { table: 'build_types', itemColumn: 'build_type', label: 'Build type', section: 'builds' },
  'skinpack-categories': { table: 'skinpack_categories', itemColumn: 'category', label: 'Skinpack category', section: 'skinpacks' },
} as const satisfies Record<string, { table: TaxonomyTable, itemColumn: string, label: string, section: BrowseSection }>

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

/**
 * Resolve the three tag fields of a browse item against the managed lists.
 *
 * Each field holds a LIST now (migration 0023), so every term in it is looked
 * up and the canonical spellings come back serialized, ready to bind. Shared
 * by the create and the update endpoint: they carried a copy each of this
 * block, and a product that one accepts while the other rejects it is exactly
 * the drift that makes an edit lose a tag.
 *
 * Throws 400 naming every unknown term at once, not one per attempt.
 */
export async function resolveTagFields(
  db: TaxonomyDb,
  input: { isSkinpack: boolean, build_type: unknown, theme: unknown, category: unknown }
): Promise<{ build_type: string, theme: string, category: string }> {
  // A skinpack has no build type or theme -- "Structures" and "Fantasy"
  // describe builds -- and its categories come from their own list.
  const wanted = {
    build_type: input.isSkinpack ? [] : toTagList(input.build_type),
    theme: input.isSkinpack ? [] : toTagList(input.theme),
    category: toTagList(input.category),
  }

  const required: [keyof typeof wanted, string][] = input.isSkinpack
    ? [['category', 'category']]
    : [['build_type', 'build type'], ['theme', 'theme'], ['category', 'category']]
  const missing = required.filter(([field]) => wanted[field].length === 0)
  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: missing.map(([, label]) => `At least one ${label} is required.`).join(' '),
    })
  }

  const tables = {
    build_type: 'build_types',
    theme: 'themes',
    category: input.isSkinpack ? 'skinpack_categories' : 'categories',
  } as const satisfies Record<keyof typeof wanted, TaxonomyTable>
  const labels = { build_type: 'Build type', theme: 'Theme', category: 'Category' } as const

  const resolved: Record<keyof typeof wanted, string[]> = { build_type: [], theme: [], category: [] }
  const unknown: string[] = []

  for (const field of ['build_type', 'theme', 'category'] as const) {
    for (const name of wanted[field]) {
      const canonical = await findTaxonomyTerm(db, tables[field], name)
      if (!canonical) {
        unknown.push(`${labels[field]} "${name}" is not in the list. Add it under Taxonomies first.`)
        continue
      }
      // The same term named twice (in two spellings, even) must not be
      // stored twice: the product page would show the chip twice and the
      // taxonomy admin's usage count would be off.
      if (!resolved[field].includes(canonical)) resolved[field].push(canonical)
    }
  }

  if (unknown.length > 0) {
    throw createError({ statusCode: 400, statusMessage: unknown.join(' ') })
  }

  return {
    build_type: serializeTags(resolved.build_type),
    theme: serializeTags(resolved.theme),
    category: serializeTags(resolved.category),
  }
}
