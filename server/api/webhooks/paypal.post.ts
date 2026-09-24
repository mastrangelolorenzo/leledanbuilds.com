import { decidePayPalWebhookOutcome, getPayPalAccessToken, verifyPayPalWebhookSignature } from '../../lib/paypal'

interface PayPalWebhookEvent {
  event_type: string
  resource?: {
    id?: string
    status?: string
    amount?: { currency_code?: string, value?: string }
    custom_id?: string
    supplementary_data?: { related_ids?: { order_id?: string } }
  }
}

interface OrderRow {
  id: number
  provider: string
  amount: number
  currency: string
  status: string
}

export default defineEventHandler(async (event) => {
  const clientId = event.context.cloudflare?.env?.PAYPAL_CLIENT_ID
  const clientSecret = event.context.cloudflare?.env?.PAYPAL_CLIENT_SECRET
  const apiBase = event.context.cloudflare?.env?.PAYPAL_API_BASE
  const webhookId = event.context.cloudflare?.env?.PAYPAL_WEBHOOK_ID
  if (!clientId || !clientSecret || !apiBase || !webhookId) {
    throw createError({ statusCode: 503, statusMessage: 'PayPal webhook is not configured.' })
  }

  const transmissionId = getHeader(event, 'paypal-transmission-id')
  const transmissionTime = getHeader(event, 'paypal-transmission-time')
  const certUrl = getHeader(event, 'paypal-cert-url')
  const authAlgo = getHeader(event, 'paypal-auth-algo')
  const transmissionSig = getHeader(event, 'paypal-transmission-sig')

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    // A misconfigured integration (or a probe hitting this URL) could make
    // this the ONLY trace of every rejected delivery -- never let it be silent.
    const missing = [
      !transmissionId && 'paypal-transmission-id',
      !transmissionTime && 'paypal-transmission-time',
      !certUrl && 'paypal-cert-url',
      !authAlgo && 'paypal-auth-algo',
      !transmissionSig && 'paypal-transmission-sig',
    ].filter(Boolean).join(', ')
    console.error(`[paypal-webhook] rejected: missing required header(s): ${missing}`)
    throw createError({ statusCode: 400, statusMessage: 'Missing PayPal webhook headers.' })
  }

  const rawBody = await readRawBody(event, 'utf8')
  if (!rawBody) {
    console.error('[paypal-webhook] rejected: empty request body')
    throw createError({ statusCode: 400, statusMessage: 'Empty request body.' })
  }

  // Transient/ambiguous: our own call to PayPal's token endpoint failing, or
  // the signature-verification call itself failing to reach PayPal, throws
  // out of these two calls (server/lib/paypal.ts) rather than returning a
  // boolean -- let that propagate so PayPal retries the delivery.
  const accessToken = await getPayPalAccessToken(apiBase, clientId, clientSecret)
  const valid = await verifyPayPalWebhookSignature(
    apiBase,
    accessToken,
    webhookId,
    { transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig },
    rawBody
  )
  if (!valid) {
    // A misconfigured PAYPAL_WEBHOOK_ID would make PayPal's verify API return
    // FAILURE for every genuine delivery -- log enough to diagnose that
    // without ever logging the signature/cert values themselves.
    let context = 'body was not valid JSON'
    try {
      const parsed = JSON.parse(rawBody) as { event_type?: string, resource?: { id?: string } }
      context = `event_type=${parsed.event_type}, resource_id=${parsed.resource?.id}`
    } catch {
      // keep the default context set above
    }
    console.error(`[paypal-webhook] rejected: invalid webhook signature (${context})`)
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook signature.' })
  }

  const webhookEvent = JSON.parse(rawBody) as PayPalWebhookEvent
  const resource = webhookEvent.resource

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    console.error(`[paypal-webhook] DB binding unavailable handling event ${webhookEvent.event_type} (resource ${resource?.id})`)
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  // Primary correlation key: PayPal's own order id, via related_ids.order_id.
  // PayPal documents this as present for this flow but types it optional, and
  // it can't be confirmed against a real delivery without sandbox credentials
  // -- so if it's ever absent, fall back to custom_id (our own order id,
  // set at creation in server/api/checkout/paypal.post.ts and echoed back by
  // PayPal onto the capture resource) before giving up. The webhook is the
  // safety net for a return route that captured but lost its UPDATE, so
  // losing correlation entirely here is the "customer paid, nobody ever
  // finds out" failure mode -- worth a second key.
  const relatedOrderId = resource?.supplementary_data?.related_ids?.order_id
  const customOrderId = resource?.custom_id !== undefined ? Number(resource.custom_id) : NaN
  const customOrderIdUsable = Number.isInteger(customOrderId)

  let order: OrderRow | null = null
  let resolvedVia: 'related_ids.order_id' | 'custom_id' | null = null

  if (relatedOrderId) {
    order = await db
      .prepare('SELECT id, provider, amount, currency, status FROM orders WHERE provider = ? AND provider_session_id = ?')
      .bind('paypal', relatedOrderId)
      .first<OrderRow>()
    if (order) resolvedVia = 'related_ids.order_id'
  }

  // A primary key that resolves to no row is exactly as unusable as a
  // missing one -- a real capture can arrive with a stale/unexpected
  // related_ids.order_id while custom_id (our own id) still resolves fine.
  // Only give up when BOTH are unusable, so try the fallback whenever the
  // first attempt didn't already find the order, not only when the primary
  // key was absent to begin with.
  if (!order && customOrderIdUsable) {
    order = await db
      .prepare('SELECT id, provider, amount, currency, status FROM orders WHERE provider = ? AND id = ?')
      .bind('paypal', customOrderId)
      .first<OrderRow>()
    if (order) resolvedVia = 'custom_id'
  }

  if (order && resolvedVia === 'custom_id' && relatedOrderId) {
    // Visibility into production: the primary key was present but wrong.
    console.error(`[paypal-webhook] correlated via custom_id fallback: related_ids.order_id=${relatedOrderId} matched no order, custom_id=${customOrderId} did (order ${order.id})`)
  }

  const outcome = decidePayPalWebhookOutcome(webhookEvent.event_type, resource ?? {}, order)

  if (outcome.action === 'ignore') {
    return { received: true }
  }

  if (outcome.action === 'give-up') {
    // Distinguish "an order was found via one of the keys, but give-up was
    // for some other reason (provider/status/amount/currency)" from "no key
    // resolved anything" -- the latter is the only case where "neither
    // matched an order" is actually true.
    let correlation: string
    if (order) {
      correlation = resolvedVia === 'custom_id'
        ? `resolved via custom_id=${customOrderId} (order ${order.id})`
        : `resolved via related_ids.order_id=${relatedOrderId} (order ${order.id})`
    } else if (relatedOrderId && customOrderIdUsable) {
      correlation = `related_ids.order_id=${relatedOrderId} and custom_id=${customOrderId}, neither matched an order`
    } else if (relatedOrderId) {
      correlation = `related_ids.order_id=${relatedOrderId}, no matching order`
    } else if (customOrderIdUsable) {
      correlation = `custom_id=${customOrderId}, no matching order`
    } else {
      correlation = 'no usable correlation key (neither related_ids.order_id nor custom_id present)'
    }
    console.error(`[paypal-webhook] give up: ${outcome.reason} (${correlation}, event ${webhookEvent.event_type})`)
    return { received: true }
  }

  // outcome.action === 'complete'
  const now = new Date().toISOString()
  const result = await db
    .prepare(
      `UPDATE orders SET status = 'completed', provider_reference = ?, updated_at = ?
       WHERE id = ? AND provider = 'paypal' AND status != 'completed'`
    )
    .bind(outcome.captureId, now, order!.id)
    .run()

  if (!result.meta?.changes) {
    // Zero rows can mean a concurrent completion (the return route won the
    // race) -- re-check before treating this as a failure.
    const recheck = await db.prepare('SELECT status FROM orders WHERE id = ?').bind(order!.id).first<{ status: string }>()
    if (recheck?.status === 'completed') {
      return { received: true }
    }
    console.error(`[paypal-webhook] completion UPDATE affected 0 rows for order ${order!.id} (recheck status: ${recheck?.status})`)
    // Ambiguous, not provably permanent -- let PayPal retry.
    throw createError({ statusCode: 500, statusMessage: 'Order completion failed.' })
  }

  return { received: true }
})
