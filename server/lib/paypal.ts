import { createError } from 'h3'

interface PayPalTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export async function getPayPalAccessToken(apiBase: string, clientId: string, clientSecret: string): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    // Never log the response body or the credentials we sent -- PayPal's
    // error body is not guaranteed safe to surface, and this request carried
    // our client secret. Log only enough to find this in the logs.
    console.error(`[paypal] OAuth token request failed (status ${res.status})`)
    throw createError({ statusCode: 502, statusMessage: 'Payment provider error.' })
  }
  const data = await res.json() as PayPalTokenResponse
  return data.access_token
}

export async function createPayPalOrder(
  apiBase: string,
  accessToken: string,
  params: { amount: string, currency: string, title: string, returnUrl: string, cancelUrl: string }
): Promise<{ id: string, approveUrl: string }> {
  const res = await fetch(`${apiBase}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        { amount: { currency_code: params.currency, value: params.amount }, description: params.title },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: 'PAY_NOW',
      },
    }),
  })
  if (!res.ok) {
    console.error(`[paypal] order creation failed (status ${res.status})`)
    throw createError({ statusCode: 502, statusMessage: 'Payment provider error.' })
  }
  const data = await res.json() as { id: string, links: { rel: string, href: string }[] }
  const approveLink = data.links.find(l => l.rel === 'approve')
  if (!approveLink) {
    console.error(`[paypal] order ${data.id} creation response did not include an approve link`)
    throw createError({ statusCode: 502, statusMessage: 'Payment provider error.' })
  }
  return { id: data.id, approveUrl: approveLink.href }
}

interface PayPalCaptureResult {
  status: string
  captureId: string | null
  /** Decimal string as reported by PayPal, e.g. "19.99". Null if absent. */
  amountValue: string | null
  currencyCode: string | null
}

export async function capturePayPalOrder(apiBase: string, accessToken: string, orderId: string): Promise<PayPalCaptureResult> {
  const res = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    console.error(`[paypal] order capture failed for paypal order ${orderId} (status ${res.status})`)
    throw createError({ statusCode: 502, statusMessage: 'Payment provider error.' })
  }
  const data = await res.json() as {
    status: string
    purchase_units?: { payments?: { captures?: { id: string, amount?: { currency_code?: string, value?: string } }[] } }[]
  }
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0]
  return {
    status: data.status,
    captureId: capture?.id ?? null,
    amountValue: capture?.amount?.value ?? null,
    currencyCode: capture?.amount?.currency_code ?? null,
  }
}

/**
 * orders.amount stores WHOLE EUROS (e.g. 19.99), a frozen snapshot of
 * browse_items.price taken at checkout-init time. PayPal reports captured
 * amounts as decimal strings (e.g. "19.99"). Prices are not guaranteed to be
 * integers -- the admin price field accepts decimals -- so this compares in
 * integer cents rather than as floats. An exact float comparison here caused
 * a real regression on the Stripe side where non-integer-euro orders were
 * rejected forever; rounding both sides avoids repeating it.
 *
 * A non-finite paid value (missing, non-numeric, or otherwise unparseable)
 * is treated as a mismatch, never as a pass.
 */
export function paypalAmountMatchesOrder(orderAmountEuros: number, paidValue: unknown): boolean {
  const expectedCents = Math.round(orderAmountEuros * 100)
  const paidCents = Math.round(Number(paidValue) * 100)
  if (!Number.isFinite(paidCents)) return false
  return paidCents === expectedCents
}

interface PayPalWebhookHeaders {
  transmissionId: string
  transmissionTime: string
  certUrl: string
  authAlgo: string
  transmissionSig: string
}

export async function verifyPayPalWebhookSignature(
  apiBase: string,
  accessToken: string,
  webhookId: string,
  headers: PayPalWebhookHeaders,
  body: string
): Promise<boolean> {
  let webhookEvent: unknown
  try {
    webhookEvent = JSON.parse(body)
  } catch {
    // Not valid JSON at all -- cannot even ask PayPal to verify it. This is
    // never genuine PayPal traffic (they always send valid JSON), so treat it
    // as a definitive "not verified" rather than throwing.
    console.error('[paypal] webhook body is not valid JSON, cannot verify signature')
    return false
  }

  const res = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: headers.transmissionId,
      transmission_time: headers.transmissionTime,
      cert_url: headers.certUrl,
      auth_algo: headers.authAlgo,
      transmission_sig: headers.transmissionSig,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
  })
  if (!res.ok) {
    // The verification call itself failing to reach PayPal (network blip,
    // PayPal-side 5xx, our access token rejected) is NOT the same thing as
    // PayPal telling us the signature is invalid. Collapsing the two would
    // mean a transient outage gets treated as "definitely forged" and PayPal
    // would stop retrying a perfectly good event. Throw so the caller can
    // treat this as retryable instead of silently trusting -- or silently
    // discarding -- an unverified event.
    console.error(`[paypal] webhook signature verification call failed (status ${res.status})`)
    throw createError({ statusCode: 502, statusMessage: 'Payment provider error.' })
  }
  const data = await res.json() as { verification_status: string }
  return data.verification_status === 'SUCCESS'
}
