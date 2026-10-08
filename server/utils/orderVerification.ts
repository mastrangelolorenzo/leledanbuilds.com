// server/utils/orderVerification.ts
//
// "Did the provider charge exactly what this order says?" -- the one check
// that stands between a webhook (or an admin reconcile) and handing over a
// paid file. Extracted so the two callers cannot drift: a copy of this logic
// in server/api/webhooks/stripe.post.ts that disagreed with a copy in the
// reconcile endpoint would mean an order the webhook refused could be forced
// through by hand, which is precisely the hole this prevents.

/**
 * Compare what Stripe says was charged against the frozen order snapshot.
 *
 * `sessionAmountTotal` is Stripe's amount_total, in CENTS. `orderAmount` is
 * orders.amount, in WHOLE EUROS (possibly fractional -- see the column
 * comment in migration 0012).
 *
 * Returns false for a missing or non-numeric amount rather than treating it
 * as a pass: an unreadable amount is a mismatch, never a free pass. Same
 * stance as the PayPal side.
 */
export function stripeChargeMatchesOrder(
  sessionAmountTotal: unknown,
  sessionCurrency: unknown,
  orderAmount: number,
  orderCurrency: string
): boolean {
  // Math.round, not a direct float compare: orderAmount * 100 for 19.99 is
  // 1998.9999999999998, which would never equal Stripe's integer 1999.
  const expectedCents = Math.round(orderAmount * 100)

  const amountMatches = typeof sessionAmountTotal === 'number'
    && Number.isFinite(sessionAmountTotal)
    && sessionAmountTotal === expectedCents

  // Stripe returns the currency lowercase ("eur"); the column stores it
  // uppercase ("EUR"), hence the case-insensitive compare.
  const currencyMatches = typeof sessionCurrency === 'string'
    && sessionCurrency.toUpperCase() === orderCurrency.toUpperCase()

  return amountMatches && currencyMatches
}
