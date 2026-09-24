import { describe, expect, it } from 'vitest'
import { isSafeRedirect } from './safeRedirect'

describe('isSafeRedirect', () => {
  it('accepts a plain same-origin relative path', () => {
    expect(isSafeRedirect('/app/purchases')).toBe(true)
  })

  it('accepts a nested same-origin relative path', () => {
    expect(isSafeRedirect('/browse/x')).toBe(true)
  })

  it('accepts the bare root path', () => {
    expect(isSafeRedirect('/')).toBe(true)
  })

  it('rejects a protocol-relative URL ("//evil.com")', () => {
    // Starts with "/" so a naive startsWith('/') check would wrongly accept
    // this -- browsers resolve it as an absolute URL on evil.com using
    // whatever protocol the current page loaded with.
    expect(isSafeRedirect('//evil.com')).toBe(false)
  })

  it('rejects a leading-backslash variant ("/\\evil.com")', () => {
    // Some browsers normalize a leading backslash to a second slash,
    // reproducing the same protocol-relative bypass as "//evil.com".
    expect(isSafeRedirect('/\\evil.com')).toBe(false)
  })

  it('rejects a double-backslash variant ("\\\\evil.com")', () => {
    expect(isSafeRedirect('\\\\evil.com')).toBe(false)
  })

  it('rejects an absolute https URL', () => {
    expect(isSafeRedirect('https://evil.com')).toBe(false)
  })

  it('rejects an absolute http URL', () => {
    expect(isSafeRedirect('http://evil.com')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isSafeRedirect('')).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isSafeRedirect(undefined)).toBe(false)
  })

  it('rejects null', () => {
    expect(isSafeRedirect(null)).toBe(false)
  })

  it('rejects an array (Vue Router\'s shape for a repeated query param)', () => {
    expect(isSafeRedirect(['/app', '/app'])).toBe(false)
  })

  it('rejects a number', () => {
    expect(isSafeRedirect(42)).toBe(false)
  })
})
