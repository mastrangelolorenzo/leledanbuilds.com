import { describe, it, expect } from 'vitest'
import { stripeChargeMatchesOrder } from './orderVerification'

describe('stripeChargeMatchesOrder', () => {
  it('matches a whole-euro price', () => {
    expect(stripeChargeMatchesOrder(2000, 'eur', 20, 'EUR')).toBe(true)
  })

  it('matches a price whose cents conversion is not float-exact', () => {
    // 19.99 * 100 === 1998.9999999999998 in IEEE 754, so a direct compare
    // against Stripe's integer 1999 would reject a correct payment.
    expect(stripeChargeMatchesOrder(1999, 'eur', 19.99, 'EUR')).toBe(true)
    expect(stripeChargeMatchesOrder(3995, 'eur', 39.95, 'EUR')).toBe(true)
    expect(stripeChargeMatchesOrder(1, 'eur', 0.01, 'EUR')).toBe(true)
  })

  it('rejects an underpayment by a single cent', () => {
    expect(stripeChargeMatchesOrder(1998, 'eur', 19.99, 'EUR')).toBe(false)
  })

  it('rejects an overpayment too', () => {
    // Not "close enough": a mismatch in either direction means the session
    // is not the one this order describes.
    expect(stripeChargeMatchesOrder(2000, 'eur', 19.99, 'EUR')).toBe(false)
  })

  it('compares currency case-insensitively', () => {
    expect(stripeChargeMatchesOrder(2000, 'EUR', 20, 'EUR')).toBe(true)
    expect(stripeChargeMatchesOrder(2000, 'eur', 20, 'eur')).toBe(true)
  })

  it('rejects a different currency charged for the right number', () => {
    expect(stripeChargeMatchesOrder(2000, 'usd', 20, 'EUR')).toBe(false)
  })

  it('treats a missing or unreadable amount as a mismatch, not a pass', () => {
    expect(stripeChargeMatchesOrder(undefined, 'eur', 20, 'EUR')).toBe(false)
    expect(stripeChargeMatchesOrder(null, 'eur', 20, 'EUR')).toBe(false)
    expect(stripeChargeMatchesOrder('2000', 'eur', 20, 'EUR')).toBe(false)
    expect(stripeChargeMatchesOrder(NaN, 'eur', 20, 'EUR')).toBe(false)
    expect(stripeChargeMatchesOrder(Infinity, 'eur', 20, 'EUR')).toBe(false)
  })

  it('treats a missing or unreadable currency as a mismatch', () => {
    expect(stripeChargeMatchesOrder(2000, undefined, 20, 'EUR')).toBe(false)
    expect(stripeChargeMatchesOrder(2000, null, 20, 'EUR')).toBe(false)
    expect(stripeChargeMatchesOrder(2000, 42, 20, 'EUR')).toBe(false)
  })

  it('rejects a zero charge against a non-zero order', () => {
    expect(stripeChargeMatchesOrder(0, 'eur', 20, 'EUR')).toBe(false)
  })
})
