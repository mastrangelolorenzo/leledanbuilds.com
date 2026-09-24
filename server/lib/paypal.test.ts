import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  capturePayPalOrder,
  createPayPalOrder,
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
