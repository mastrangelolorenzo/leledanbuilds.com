import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  capturePayPalOrder,
  createPayPalOrder,
  decidePayPalWebhookOutcome,
  getPayPalAccessToken,
  paypalAmountMatchesOrder,
  verifyPayPalWebhookSignature,
} from './paypal'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getPayPalAccessToken', () => {
  it('returns the access token from a successful OAuth response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok_abc', token_type: 'Bearer', expires_in: 3600 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const token = await getPayPalAccessToken('https://api-m.sandbox.paypal.com', 'client', 'secret')
    expect(token).toBe('tok_abc')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws when the OAuth request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'invalid_client' }))
    await expect(getPayPalAccessToken('https://api-m.sandbox.paypal.com', 'bad', 'bad')).rejects.toThrow()
  })

  it('never puts the provider\'s raw response body into the thrown error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'super-secret-leak-marker-xyz',
    }))
    try {
      await getPayPalAccessToken('https://api-m.sandbox.paypal.com', 'bad', 'bad')
      expect.unreachable('expected getPayPalAccessToken to throw')
    } catch (err) {
      expect(String((err as Error).message)).not.toContain('super-secret-leak-marker-xyz')
    }
  })
})

describe('createPayPalOrder', () => {
  it('returns the order id and approve link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'order_123',
        links: [
          { rel: 'self', href: 'https://api-m.sandbox.paypal.com/v2/checkout/orders/order_123' },
          { rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=order_123' },
        ],
      }),
    }))

    const result = await createPayPalOrder('https://api-m.sandbox.paypal.com', 'tok', {
      amount: '120.00',
      currency: 'EUR',
      title: 'Modern Glass Villa',
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel',
    })
    expect(result.id).toBe('order_123')
    expect(result.approveUrl).toBe('https://www.sandbox.paypal.com/checkoutnow?token=order_123')
  })

  it('throws when the response has no approve link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'order_123', links: [] }) }))
    await expect(createPayPalOrder('https://api-m.sandbox.paypal.com', 'tok', {
      amount: '120.00', currency: 'EUR', title: 'x', returnUrl: 'a', cancelUrl: 'b',
    })).rejects.toThrow()
  })

  it('throws when the order-creation request fails, without leaking the raw body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'super-secret-leak-marker-xyz',
    }))
    try {
      await createPayPalOrder('https://api-m.sandbox.paypal.com', 'tok', {
        amount: '120.00', currency: 'EUR', title: 'x', returnUrl: 'a', cancelUrl: 'b',
      })
      expect.unreachable('expected createPayPalOrder to throw')
    } catch (err) {
      expect(String((err as Error).message)).not.toContain('super-secret-leak-marker-xyz')
    }
  })
})

describe('capturePayPalOrder', () => {
  it('returns the status, capture id, and captured amount on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'COMPLETED',
        purchase_units: [{ payments: { captures: [{ id: 'cap_456', amount: { currency_code: 'EUR', value: '19.99' } }] } }],
      }),
    }))
    const result = await capturePayPalOrder('https://api-m.sandbox.paypal.com', 'tok', 'order_123')
    expect(result.status).toBe('COMPLETED')
    expect(result.captureId).toBe('cap_456')
    expect(result.amountValue).toBe('19.99')
    expect(result.currencyCode).toBe('EUR')
  })

  // Addendum item 1 / item 9: approval is not payment, and a capture that
  // didn't complete must never be mistaken for one. The route-level guard
  // (`capture.status !== 'COMPLETED'`) is what actually enforces this; this
  // test proves the library itself reports the status faithfully rather than
  // normalizing or coercing it, which is what that guard depends on.
  it('returns a non-COMPLETED status faithfully rather than coercing it to success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'PENDING', purchase_units: [{ payments: { captures: [] } }] }),
    }))
    const result = await capturePayPalOrder('https://api-m.sandbox.paypal.com', 'tok', 'order_123')
    expect(result.status).toBe('PENDING')
    expect(result.status === 'COMPLETED').toBe(false)
    expect(result.captureId).toBeNull()
  })

  it('throws when the capture request fails, without leaking the raw body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'super-secret-leak-marker-xyz',
    }))
    try {
      await capturePayPalOrder('https://api-m.sandbox.paypal.com', 'tok', 'order_123')
      expect.unreachable('expected capturePayPalOrder to throw')
    } catch (err) {
      expect(String((err as Error).message)).not.toContain('super-secret-leak-marker-xyz')
    }
  })
})

describe('paypalAmountMatchesOrder', () => {
  it('agrees when 19.99 euros is compared against a paid value of "19.99" (1999 cents)', () => {
    expect(paypalAmountMatchesOrder(19.99, '19.99')).toBe(true)
  })

  it('disagrees when 19.98 euros is compared against a paid value of "19.99" (1999 cents)', () => {
    expect(paypalAmountMatchesOrder(19.98, '19.99')).toBe(false)
  })

  it('treats a non-numeric paid value as a mismatch, not a pass', () => {
    expect(paypalAmountMatchesOrder(19.99, 'not-a-number')).toBe(false)
  })

  it('treats a missing paid value as a mismatch', () => {
    expect(paypalAmountMatchesOrder(19.99, undefined)).toBe(false)
  })

  it('treats a null paid value as a mismatch', () => {
    expect(paypalAmountMatchesOrder(19.99, null)).toBe(false)
  })

  it('agrees for whole-euro amounts', () => {
    expect(paypalAmountMatchesOrder(120, '120.00')).toBe(true)
  })

  it('tolerates float drift from the same underlying euro value', () => {
    // 19.99 * 100 is 1998.9999999999998 in IEEE-754 -- this is the exact
    // regression the Stripe side hit; rounding on both sides must absorb it.
    expect(paypalAmountMatchesOrder(19.99, (19.99).toFixed(2))).toBe(true)
  })

  // The test above compares 19.99 against Number("19.99") * 100 -- the same
  // underlying float multiplied the same way on both sides, so it would
  // still pass with Math.round deleted entirely and proves nothing about
  // rounding specifically. This one is genuinely discriminating: the admin
  // price field only validates `typeof price === 'number'`, so a
  // three-decimal price like 19.999 is reachable, and PayPal is quoted the
  // *rounded* "20.00" (item.price.toFixed(2) in checkout/paypal.post.ts)
  // while orders.amount stores the raw 19.999. Only rounding both sides
  // before comparing keeps that correctly-paid order from being rejected --
  // without Math.round, 19.999 * 100 = 1999.9000000000001 !== 2000.
  it('matches when the quoted string was rounded to cents but the stored price was not', () => {
    expect(paypalAmountMatchesOrder(19.999, '20.00')).toBe(true)
  })

  // C1 regression: at an x.xx5 price, item.price.toFixed(2) (the old,
  // buggy quoting in server/api/checkout/paypal.post.ts) and
  // Math.round(price * 100) (what this function verifies with) round the
  // same number in two different directions. This proves both halves of
  // the bug directly: the old quoting really did disagree with the
  // verifier, and the fixed quoting -- (Math.round(price * 100) / 100
  // ).toFixed(2), now used at the checkout call site -- agrees with it.
  it('at an x.xx5 price, disagrees with the old toFixed(2) quoting but agrees with the corrected cents-based quoting', () => {
    const price = 39.955
    const oldQuoted = price.toFixed(2) // the bug: PayPal would have been quoted "39.95"
    const newQuoted = (Math.round(price * 100) / 100).toFixed(2) // the fix: "39.96"

    expect(oldQuoted).toBe('39.95')
    expect(newQuoted).toBe('39.96')
    expect(paypalAmountMatchesOrder(price, oldQuoted)).toBe(false)
    expect(paypalAmountMatchesOrder(price, newQuoted)).toBe(true)
  })

  // M9: Number(null) is 0, so without an explicit type check a capture that
  // reported NO amount at all (paidValue: null) would "match" a €0 order --
  // treating "we don't know what was paid" as "definitely 0 was paid".
  it('never matches a non-string paid value, even against a zero-amount order', () => {
    expect(paypalAmountMatchesOrder(0, null)).toBe(false)
    expect(paypalAmountMatchesOrder(0, undefined)).toBe(false)
  })
})

describe('verifyPayPalWebhookSignature', () => {
  const headers = { transmissionId: 't1', transmissionTime: 'now', certUrl: 'https://x', authAlgo: 'SHA256withRSA', transmissionSig: 'sig' }

  it('returns true when PayPal reports SUCCESS', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ verification_status: 'SUCCESS' }) }))
    expect(await verifyPayPalWebhookSignature('https://api-m.sandbox.paypal.com', 'tok', 'wh_123', headers, '{"event_type":"PAYMENT.CAPTURE.COMPLETED"}')).toBe(true)
  })

  it('returns false when PayPal reports FAILURE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ verification_status: 'FAILURE' }) }))
    expect(await verifyPayPalWebhookSignature('https://api-m.sandbox.paypal.com', 'tok', 'wh_123', headers, '{}')).toBe(false)
  })

  // Addendum item 4: the verify call itself failing to reach PayPal is
  // transient/ambiguous, NOT the same as PayPal saying the signature is
  // invalid. The brief's original version of this test asserted `false`
  // here; that collapsed the two cases and made a transient PayPal-side
  // outage indistinguishable from a forged event. This now asserts the
  // corrected behavior: throw, so the webhook route lets PayPal retry
  // instead of either trusting or permanently discarding the event.
  it('throws when the verification request itself fails to reach PayPal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(verifyPayPalWebhookSignature('https://api-m.sandbox.paypal.com', 'tok', 'wh_123', headers, '{}')).rejects.toThrow()
  })

  it('returns false without calling PayPal when the body is not valid JSON', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await verifyPayPalWebhookSignature('https://api-m.sandbox.paypal.com', 'tok', 'wh_123', headers, 'not-json')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// Fix round 1, item 5: the webhook's decision logic has no self-signing
// substitute the way Stripe's does (PayPal's signature check is itself an
// outbound API call), so this is the only way to exercise every branch.
// Fixtures represent a fully-valid PAYMENT.CAPTURE.COMPLETED capture and a
// matching, still-pending order; each test overrides exactly the field(s)
// under test.
describe('decidePayPalWebhookOutcome', () => {
  const validResource = {
    id: 'CAPTURE_1',
    status: 'COMPLETED',
    amount: { value: '19.99', currency_code: 'EUR' },
  }
  const validOrder = {
    id: 42,
    provider: 'paypal',
    amount: 19.99,
    currency: 'EUR',
    status: 'pending',
  }

  it('ignores any event_type other than PAYMENT.CAPTURE.COMPLETED (settlement gate: approval is not payment)', () => {
    const outcome = decidePayPalWebhookOutcome('CHECKOUT.ORDER.APPROVED', validResource, validOrder)
    expect(outcome.action).toBe('ignore')
  })

  it('gives up when no order was found for this capture', () => {
    const outcome = decidePayPalWebhookOutcome('PAYMENT.CAPTURE.COMPLETED', validResource, null)
    expect(outcome.action).toBe('give-up')
  })

  it('gives up when the order belongs to a different provider', () => {
    const outcome = decidePayPalWebhookOutcome('PAYMENT.CAPTURE.COMPLETED', validResource, { ...validOrder, provider: 'stripe' })
    expect(outcome.action).toBe('give-up')
  })

  it('ignores (idempotent no-op) when the order is already completed', () => {
    const outcome = decidePayPalWebhookOutcome('PAYMENT.CAPTURE.COMPLETED', validResource, { ...validOrder, status: 'completed' })
    expect(outcome.action).toBe('ignore')
  })

  it('gives up on a non-COMPLETED capture status (settlement gate: approval is not payment)', () => {
    const outcome = decidePayPalWebhookOutcome('PAYMENT.CAPTURE.COMPLETED', { ...validResource, status: 'PENDING' }, validOrder)
    expect(outcome.action).toBe('give-up')
  })

  it('gives up when the order currency is not EUR', () => {
    const outcome = decidePayPalWebhookOutcome('PAYMENT.CAPTURE.COMPLETED', validResource, { ...validOrder, currency: 'USD' })
    expect(outcome.action).toBe('give-up')
  })

  it('gives up when the captured currency does not match the order currency', () => {
    const outcome = decidePayPalWebhookOutcome(
      'PAYMENT.CAPTURE.COMPLETED',
      { ...validResource, amount: { value: '19.99', currency_code: 'USD' } },
      validOrder
    )
    expect(outcome.action).toBe('give-up')
  })

  it('gives up when the captured amount does not match the order amount', () => {
    const outcome = decidePayPalWebhookOutcome(
      'PAYMENT.CAPTURE.COMPLETED',
      { ...validResource, amount: { value: '9.99', currency_code: 'EUR' } },
      validOrder
    )
    expect(outcome.action).toBe('give-up')
  })

  it('gives up when a COMPLETED capture carries no capture id to store', () => {
    const outcome = decidePayPalWebhookOutcome('PAYMENT.CAPTURE.COMPLETED', { ...validResource, id: undefined }, validOrder)
    expect(outcome.action).toBe('give-up')
  })

  it('completes when the event is a genuine, matching, COMPLETED capture for a pending paypal order', () => {
    const outcome = decidePayPalWebhookOutcome('PAYMENT.CAPTURE.COMPLETED', validResource, validOrder)
    expect(outcome).toEqual({ action: 'complete', captureId: 'CAPTURE_1' })
  })

  it('completes for a non-integer-euro price using the same rounded-cents comparison as paypalAmountMatchesOrder', () => {
    // 19.999 stored raw, quoted to PayPal rounded to "20.00" -- see the
    // paypalAmountMatchesOrder discriminating test above.
    const outcome = decidePayPalWebhookOutcome(
      'PAYMENT.CAPTURE.COMPLETED',
      { ...validResource, amount: { value: '20.00', currency_code: 'EUR' } },
      { ...validOrder, amount: 19.999 }
    )
    expect(outcome.action).toBe('complete')
  })
})
