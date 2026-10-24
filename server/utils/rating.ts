// Shared by server/api/browse-items/[id]/rating.put.ts (which returns the
// item's new score) and server/api/browse-items/index.get.ts (which returns
// every item's). Keeping both the range check and the rounding here is what
// stops the two routes from disagreeing about the same item.

export const MIN_RATING = 1
export const MAX_RATING = 5

/**
 * Whole numbers 1-5 only. The column carries the same range as a CHECK
 * constraint, so anything this rejects would otherwise surface as a raw SQL
 * error instead of a 400 -- and Number.isInteger also rules out 4.5, NaN,
 * Infinity and the string "4".
 */
export function isValidRating(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_RATING && (value as number) <= MAX_RATING
}

/** Average of `total` over `count`, to one decimal. 0 when nobody has rated. */
export function ratingAverage(total: number, count: number): number {
  if (!count || count <= 0) return 0
  return Math.round((total / count) * 10) / 10
}
