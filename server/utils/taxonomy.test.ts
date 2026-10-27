import { describe, it, expect } from 'vitest'
import {
  findTaxonomyTerm,
  normalizeTermName,
  isTaxonomyKind,
  resolveTaxonomy,
  TAXONOMIES,
  MAX_TERM_LENGTH,
} from './taxonomy'
import { BROWSE_SECTIONS } from './postValidation'

function fakeDb(existing: string | null) {
  const calls: { sql: string, args: unknown[] }[] = []
  return {
    calls,
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          calls.push({ sql, args })
          return {
            first: async <T>() => (existing ? ({ name: existing } as T) : null),
            run: async () => undefined,
          }
        },
      }
    },
  }
}

describe('normalizeTermName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeTermName('  Cyberpunk  ')).toBe('Cyberpunk')
  })

  it('collapses internal whitespace so look-alike terms cannot both exist', () => {
    expect(normalizeTermName('Modern  House')).toBe('Modern House')
    expect(normalizeTermName('Modern\tHouse')).toBe('Modern House')
  })

  it('rejects an empty or whitespace-only name', () => {
    expect(normalizeTermName('')).toBeNull()
    expect(normalizeTermName('   ')).toBeNull()
  })

  it('rejects a name longer than the limit', () => {
    expect(normalizeTermName('x'.repeat(MAX_TERM_LENGTH))).toBe('x'.repeat(MAX_TERM_LENGTH))
    expect(normalizeTermName('x'.repeat(MAX_TERM_LENGTH + 1))).toBeNull()
  })

  it('rejects control characters', () => {
    // These render as invisible garbage on a public product page.
    expect(normalizeTermName('Mod\u0000ern')).toBeNull()
    expect(normalizeTermName('Mod\u007Fern')).toBeNull()
  })

  it('rejects non-strings', () => {
    expect(normalizeTermName(undefined)).toBeNull()
    expect(normalizeTermName(null)).toBeNull()
    expect(normalizeTermName(42)).toBeNull()
  })
})

describe('findTaxonomyTerm', () => {
  it('returns the STORED spelling, not the caller\'s', async () => {
    // This is what stops "modern" and "Modern" both reaching the public site.
    const db = fakeDb('Modern')
    expect(await findTaxonomyTerm(db as never, 'themes', 'modern')).toBe('Modern')
  })

  it('looks the term up by its trimmed form', async () => {
    const db = fakeDb('Cyberpunk')
    await findTaxonomyTerm(db as never, 'themes', '  Cyberpunk  ')
    expect(db.calls[0]!.args[0]).toBe('Cyberpunk')
  })

  it('returns null for an unknown term instead of creating it', async () => {
    // The old ensureTaxonomyTerm inserted here; that is exactly how typos
    // became permanent categories.
    const db = fakeDb(null)
    expect(await findTaxonomyTerm(db as never, 'categories', 'Brand New')).toBeNull()
    const inserts = db.calls.filter(c => /INSERT/i.test(c.sql))
    expect(inserts).toHaveLength(0)
  })

  it('returns null for a name that cannot be normalised', async () => {
    const db = fakeDb('whatever')
    expect(await findTaxonomyTerm(db as never, 'categories', '   ')).toBeNull()
    expect(db.calls).toHaveLength(0)
  })

  it('refuses a table outside the allow-list', async () => {
    const db = fakeDb(null)
    await expect(
      findTaxonomyTerm(db as never, 'users; DROP TABLE users' as never, 'x')
    ).rejects.toThrow(/Invalid taxonomy table/)
  })
})

describe('taxonomy kinds', () => {
  it('accepts only the known kinds', () => {
    expect(isTaxonomyKind('categories')).toBe(true)
    expect(isTaxonomyKind('themes')).toBe(true)
    expect(isTaxonomyKind('build-types')).toBe(true)
    expect(isTaxonomyKind('skinpack-categories')).toBe(true)
    expect(isTaxonomyKind('users')).toBe(false)
    expect(isTaxonomyKind('')).toBe(false)
    expect(isTaxonomyKind(undefined)).toBe(false)
  })

  it('does not treat inherited Object properties as kinds', () => {
    // A plain `kind in TAXONOMIES` check would accept these and then
    // interpolate undefined into SQL.
    expect(isTaxonomyKind('constructor')).toBe(false)
    expect(isTaxonomyKind('toString')).toBe(false)
    expect(isTaxonomyKind('__proto__')).toBe(false)
  })

  it('resolves to a table, item column and section, or null', () => {
    expect(resolveTaxonomy('categories')).toEqual({
      table: 'categories', itemColumn: 'category', label: 'Category', section: 'builds',
    })
    expect(resolveTaxonomy('skinpack-categories')).toEqual({
      table: 'skinpack_categories', itemColumn: 'category', label: 'Skinpack category', section: 'skinpacks',
    })
    expect(resolveTaxonomy('nope')).toBeNull()
    expect(resolveTaxonomy('constructor')).toBeNull()
  })

  it('maps every kind to a distinct table', () => {
    const tables = Object.values(TAXONOMIES).map(t => t.table)
    expect(new Set(tables).size).toBe(tables.length)
  })

  // Builds and skinpacks both keep their term in browse_items.category, so
  // the column alone no longer identifies a list -- the pair does, and the
  // section is what keeps one catalogue's usage counts and delete guards out
  // of the other's.
  it('maps every kind to a distinct column-and-section pair', () => {
    const pairs = Object.values(TAXONOMIES).map(t => `${t.itemColumn}:${t.section}`)
    expect(new Set(pairs).size).toBe(pairs.length)
    for (const entry of Object.values(TAXONOMIES)) {
      expect(BROWSE_SECTIONS).toContain(entry.section)
    }
  })
})
