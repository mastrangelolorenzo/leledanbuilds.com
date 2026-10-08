import { describe, it, expect } from 'vitest'
import { clientIpKey, emailKey, RATE_LIMITS } from './rateLimit'

describe('clientIpKey', () => {
  it('uses the header value when present', () => {
    expect(clientIpKey('203.0.113.7')).toBe('203.0.113.7')
  })

  it('trims surrounding whitespace', () => {
    expect(clientIpKey('  203.0.113.7  ')).toBe('203.0.113.7')
  })

  it('falls back to a single shared bucket when the header is missing', () => {
    // Deliberate: an absent CF-Connecting-IP means we cannot distinguish
    // callers, so they share one bucket rather than each getting an
    // unlimited private one.
    expect(clientIpKey(undefined)).toBe('unknown')
    expect(clientIpKey(null)).toBe('unknown')
    expect(clientIpKey('   ')).toBe('unknown')
  })
})

describe('emailKey', () => {
  it('lowercases and trims so one account cannot be split across buckets', () => {
    expect(emailKey('  A@B.com ')).toBe('a@b.com')
    expect(emailKey('a@b.com')).toBe('a@b.com')
  })
})

describe('RATE_LIMITS', () => {
  it('defines a positive limit and window for every rule', () => {
    for (const [name, r] of Object.entries(RATE_LIMITS)) {
      expect(r.limit, name).toBeGreaterThan(0)
      expect(r.windowSeconds, name).toBeGreaterThan(0)
    }
  })

  it('gives every rule a distinct bucket so counters cannot collide', () => {
    const buckets = Object.values(RATE_LIMITS).map(r => r.bucket)
    expect(new Set(buckets).size).toBe(buckets.length)
  })

  it('keeps every window within the sweep horizon in enforceRateLimit', () => {
    // sweepExpired deletes rows older than 24h; a rule with a longer window
    // would have its live counters swept out from under it.
    for (const [name, r] of Object.entries(RATE_LIMITS)) {
      expect(r.windowSeconds, name).toBeLessThan(60 * 60 * 24)
    }
  })
})
