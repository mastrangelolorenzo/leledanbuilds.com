// server/utils/difficultyColors.ts
//
// Backs the `difficulty_colors` table (server/database/migrations/0014_create_difficulty_colors.sql):
// one configurable colour per fixed difficulty level. The level names are
// intentionally NOT configurable here -- they are enforced by the CHECK
// constraint on browse_items.difficulty (migration 0008) and this table's
// own CHECK, so both stay in lockstep by construction.

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard', 'Expert'] as const
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number]

export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return typeof value === 'string' && (DIFFICULTY_LEVELS as readonly string[]).includes(value)
}

// Strict 6-digit hex colour, nothing else. This is deliberately narrow, not
// a "best-effort" CSS colour parser: the validated value is interpolated
// directly into an inline `style` attribute on a public page
// (app/pages/browse/[slug].vue's dot colouring), so any input that isn't
// exactly `#` followed by 6 hex digits must be rejected outright -- e.g. a
// stored value like `red;background:url(...)` is a CSS/HTML injection
// vector, not a colour to sanitize and salvage.
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

export function isValidHexColor(value: unknown): boolean {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value)
}
