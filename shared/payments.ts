// Minimum order value PayPal checkout accepts, in euros.
//
// PayPal's EUR commercial-transaction fee has a fixed component on top of
// the percentage, so on a €1-2 build that fixed part eats most of the sale.
// Card checkout has no such floor, so a cheap build stays buyable — just
// not with PayPal.
//
// Lives in shared/ because both sides need the same number: the server
// enforces it (the client can be bypassed) and the product page uses it to
// explain up front why the PayPal button isn't there, instead of letting
// someone click it and get an error.
export const PAYPAL_MINIMUM_EUROS = 5

// Compare in integer cents rather than `price >= 5`: prices arrive as
// floats, and a value stored as 4.999999999 would otherwise slip through
// (or an exact 5 be rejected) depending on the binary representation. This
// matches how paypalAmountMatchesOrder rounds, so the two never disagree.
export function meetsPayPalMinimum(priceEuros: number): boolean {
  if (!Number.isFinite(priceEuros)) return false
  return Math.round(priceEuros * 100) >= PAYPAL_MINIMUM_EUROS * 100
}
