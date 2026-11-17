// server/utils/browseTags.ts
//
// build_type, theme and category each hold a LIST of terms, stored in their
// existing TEXT column as a JSON array (migration 0023) -- the same shape
// pricing already uses for its feature list.
//
// Shared by the server and by the pages: /browse filters on these lists and
// the product page prints them, so the parsing rules have to be one copy.

/**
 * Read a stored tag column.
 *
 * Accepts a bare term as well as a JSON array. Migration 0023 converts every
 * existing row, but a browser that is still running the previous build keeps
 * writing a bare string until it reloads, and a deploy is not instantaneous
 * -- a reader that threw away those values would blank out a product's tags
 * for the length of that window.
 */
export function parseTags(stored: unknown): string[] {
  if (typeof stored !== 'string' || stored === '') return []
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === 'string' && t !== '')
    }
  } catch {
    // Not JSON at all: a row written before 0023, holding the single term.
  }
  return [stored]
}

export function serializeTags(tags: string[]): string {
  return JSON.stringify(tags)
}

/** Does this product carry any of the terms the visitor ticked? */
export function matchesAnyTag(itemTags: string[], wanted: string[]): boolean {
  return itemTags.some((tag) => wanted.includes(tag))
}

/**
 * Normalize a tag field arriving in a request body.
 *
 * The admin form sends an array, but the body is untrusted and an older form
 * still in a tab sends a plain string, so both shapes are read and anything
 * else in the list is dropped rather than stored. Trimming here keeps a
 * stray " Organic" from being looked up (and rejected) as an unknown term.
 */
export function toTagList(input: unknown): string[] {
  const list = Array.isArray(input) ? input : [input]
  return list
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim())
    .filter((t) => t !== '')
}
