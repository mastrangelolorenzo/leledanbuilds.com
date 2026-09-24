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
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Stripe checkout session creation failed (${res.status}): ${errBody}`)
  }

  const data = await res.json() as { id: string, url: string }
  return { id: data.id, url: data.url }
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
  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=')
    if (key && value) acc[key] = value
    return acc
  }, {})

  const timestamp = parts.t
  const v1 = parts.v1
  if (!timestamp || !v1) return false

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - Number(timestamp)) > toleranceSeconds) return false

  const expected = await hmacSha256Hex(secret, `${timestamp}.${payload}`)
  return timingSafeEqual(expected, v1)
}
