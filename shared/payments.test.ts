import { describe, expect, it } from 'vitest'
import { PAYPAL_MINIMUM_EUROS, meetsPayPalMinimum } from './payments'

describe('meetsPayPalMinimum', () => {
  it('accepts exactly the minimum', () => {
    expect(meetsPayPalMinimum(PAYPAL_MINIMUM_EUROS)).toBe(true)
  })

  it('accepts anything above the minimum', () => {
    expect(meetsPayPalMinimum(5.01)).toBe(true)
    expect(meetsPayPalMinimum(20)).toBe(true)
    expect(meetsPayPalMinimum(39.99)).toBe(true)
  })

  it('rejects anything below the minimum', () => {
    expect(meetsPayPalMinimum(4.99)).toBe(false)
    expect(meetsPayPalMinimum(1)).toBe(false)
    expect(meetsPayPalMinimum(0)).toBe(false)
  })

  // A price one hundredth of a cent under the minimum rounds up to 500
  // cents, which is what PayPal would be quoted for it ("5.00") -- so
  // accepting it is correct, and is the reason this compares rounded cents
  // instead of the raw float.
  it('agrees with the amount PayPal is actually quoted', () => {
    expect(meetsPayPalMinimum(4.9999)).toBe(true)
    expect(meetsPayPalMinimum(4.994)).toBe(false)
  })

  it('rejects values that are not real numbers', () => {
    expect(meetsPayPalMinimum(Number.NaN)).toBe(false)
    expect(meetsPayPalMinimum(Number.POSITIVE_INFINITY)).toBe(false)
    expect(meetsPayPalMinimum(undefined as unknown as number)).toBe(false)
  })

  it('rejects a negative price', () => {
    expect(meetsPayPalMinimum(-10)).toBe(false)
  })
})
