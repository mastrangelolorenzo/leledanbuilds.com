import { describe, expect, it } from 'vitest'
import { DIFFICULTY_LEVELS, isDifficultyLevel, isValidHexColor } from './difficultyColors'

describe('isValidHexColor', () => {
  it('accepts a valid 6-digit hex colour', () => {
    expect(isValidHexColor('#22c55e')).toBe(true)
  })

  it('accepts uppercase hex digits', () => {
    expect(isValidHexColor('#ABCDEF')).toBe(true)
  })

  it('rejects a 3-digit hex shorthand', () => {
    expect(isValidHexColor('#fff')).toBe(false)
  })

  it('rejects a value missing the leading #', () => {
    expect(isValidHexColor('22c55e')).toBe(false)
  })

  it('rejects a value that is too short', () => {
    expect(isValidHexColor('#22c55')).toBe(false)
  })

  it('rejects a value that is too long', () => {
    expect(isValidHexColor('#22c55ee')).toBe(false)
  })

  it('rejects non-hex characters', () => {
    expect(isValidHexColor('#zzzzzz')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidHexColor('')).toBe(false)
  })

  // The exact injection shape this validator exists to stop: the colour is
  // interpolated directly into an inline `style` attribute on a public page
  // (app/pages/browse/[slug].vue), so a stored value that breaks out of the
  // hex-colour position must never pass.
  it('rejects a CSS injection attempt', () => {
    expect(isValidHexColor('red;background:url(https://evil.example/x)')).toBe(false)
  })

  it('rejects a CSS named colour', () => {
    expect(isValidHexColor('red')).toBe(false)
  })

  it('rejects a non-string value', () => {
    expect(isValidHexColor(123)).toBe(false)
    expect(isValidHexColor(null)).toBe(false)
    expect(isValidHexColor(undefined)).toBe(false)
  })
})

describe('isDifficultyLevel', () => {
  it('accepts each of the four canonical levels', () => {
    for (const level of DIFFICULTY_LEVELS) {
      expect(isDifficultyLevel(level)).toBe(true)
    }
  })

  it('rejects an unknown level', () => {
    expect(isDifficultyLevel('Insane')).toBe(false)
  })

  it('rejects a non-string value', () => {
    expect(isDifficultyLevel(1)).toBe(false)
    expect(isDifficultyLevel(null)).toBe(false)
  })
})
