import { createError } from 'h3'

export async function createStripeCheckoutSession(
  secretKey: string,
  params: {
    title: string
    unitAmount: number // in cents
    currency: string
    quantity: number
    successUrl: string
    cancelUrl: string
    metadata: Record<string, string>
  }
): Promise<{ id: string, url: string }> {
  const body = new URLSearchParams()
  body.set('mode', 'payment')
  body.set('success_url', params.successUrl)
  body.set('cancel_url', params.cancelUrl)
  body.set('line_items[0][quantity]', String(params.quantity))
  body.set('line_items[0][price_data][currency]', params.currency)
  body.set('line_items[0][price_data][unit_amount]', String(params.unitAmount))
  body.set('line_items[0][price_data][product_data][name]', params.title)
  for (const [key, value] of Object.entries(params.metadata)) {
    body.set(`metadata[${key}]`, value)
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2025-08-27.basil',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    // Never log the raw upstream body -- it can carry customer-identifying
    // data from what we sent (e.g. the product title). Status plus, if
    // cheaply parseable, Stripe's own error code/type is enough to diagnose
    // from logs without that risk (matches the PayPal lib's status-only logging).
    let errorCode: string | undefined
    try {
      const errBody = await res.json() as { error?: { code?: string, type?: string } }
      errorCode = errBody.error?.code ?? errBody.error?.type
    } catch {
      // Not parseable JSON -- nothing cheap to extract, log status only.
    }
    console.error(`[stripe] checkout session creation failed (status ${res.status}${errorCode ? `, code=${errorCode}` : ''})`)
    throw createError({ statusCode: 502, statusMessage: 'Payment provider error.' })
  }

  const data = await res.json() as { id: string, url: string }
  return { id: data.id, url: data.url }
}

/**
 * Fetch an existing Checkout Session so a still-open one can be reused
 * instead of creating a second session for the same purchase (see the
 * reuse path in server/api/checkout/stripe.post.ts).
 *
 * Returns null rather than throwing on ANY failure -- a 404 for a session
 * from a different Stripe account or mode, a network blip, an expired id.
 * The caller's fallback is to create a fresh session, which is always safe,
 * so a failure here must degrade to that rather than breaking checkout.
 */
export async function retrieveStripeCheckoutSession(
  secretKey: string,
  sessionId: string
): Promise<{
  id: string
  url: string | null
  // Checkout Session lifecycle: 'open' | 'complete' | 'expired'.
  status: string | null
  // Settlement state: only 'paid' means the money is actually ours. A
  // delayed method (SEPA, Klarna) sits at 'unpaid' until it settles.
  payment_status: string | null
  // In cents, as Stripe reports it.
  amount_total: number | null
  currency: string | null
  payment_intent: string | null
} | null> {
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Stripe-Version': '2025-08-27.basil',
        },
      }
    )

    if (!res.ok) {
      console.error(`[stripe] could not retrieve session (status ${res.status}); will create a new one`)
      return null
    }

    const data = await res.json() as {
      id?: string
      url?: string | null
      status?: string | null
      payment_status?: string | null
      amount_total?: number | null
      currency?: string | null
      // Expands to an object when the caller asks for it; we don't, so this
      // is the bare id string. Narrowed below rather than trusted, so an
      // expanded payload cannot put an object where a string is expected.
      payment_intent?: unknown
    }
    if (!data.id) return null
    return {
      id: data.id,
      url: data.url ?? null,
      status: data.status ?? null,
      payment_status: data.payment_status ?? null,
      amount_total: typeof data.amount_total === 'number' ? data.amount_total : null,
      currency: data.currency ?? null,
      payment_intent: typeof data.payment_intent === 'string' ? data.payment_intent : null,
    }
  } catch (e) {
    console.error('[stripe] error retrieving session; will create a new one:', e)
    return null
  }
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
): Promise<boolean> {
  let timestamp: string | undefined
  const signatures: string[] = []

  for (const part of signatureHeader.split(',')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (!value) continue
    if (key === 't') timestamp = value
    // Stripe sends one v1 per currently-active endpoint secret, so during a
    // secret rotation there are several and any one of them may be ours.
    else if (key === 'v1') signatures.push(value)
  }

  if (!timestamp || signatures.length === 0) return false

  const timestampSeconds = Number(timestamp)
  if (!Number.isFinite(timestampSeconds)) return false

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) return false

  const expected = await hmacSha256Hex(secret, `${timestamp}.${payload}`)
  return signatures.some(signature => timingSafeEqual(expected, signature))
}
