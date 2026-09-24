import { getPayPalAccessToken, paypalAmountMatchesOrder, verifyPayPalWebhookSignature } from '../../lib/paypal'

interface PayPalWebhookEvent {
  event_type: string
  resource: {
    id: string
    status?: string
    amount?: { currency_code?: string, value?: string }
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
    throw createError({ statusCode: 400, statusMessage: 'Missing PayPal webhook headers.' })
  }

  const rawBody = await readRawBody(event, 'utf8')
  if (!rawBody) {
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
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook signature.' })
  }

  const webhookEvent = JSON.parse(rawBody) as PayPalWebhookEvent

  // CHECKOUT.ORDER.APPROVED and everything else is deliberately never a
  // completion trigger -- approval is not captured money. Only a genuine
  // capture-completed event may complete an order.
  if (webhookEvent.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return { received: true }
  }

  const resource = webhookEvent.resource
  const orderToken = resource?.supplementary_data?.related_ids?.order_id
  if (!orderToken) {
    console.error(`[paypal-webhook] PAYMENT.CAPTURE.COMPLETED capture ${resource?.id} carries no related order_id`)
    // Permanent: this event will never carry one on redelivery.
    return { received: true }
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    console.error(`[paypal-webhook] DB binding unavailable handling capture ${resource.id} for paypal order ${orderToken}`)
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const order = await db
    .prepare('SELECT id, provider, amount, currency, status FROM orders WHERE provider = ? AND provider_session_id = ?')
    .bind('paypal', orderToken)
    .first<OrderRow>()

  if (!order) {
    // Permanent: the (provider, provider_session_id) association is made
    // once, synchronously, at checkout-init time, before the buyer can ever
    // reach approval -- if no row has this PayPal order id now, retrying
    // delivery of the same event will never make one appear.
    console.error(`[paypal-webhook] no order found for paypal order ${orderToken} (capture ${resource.id})`)
    return { received: true }
  }
  if (order.provider !== 'paypal') {
    console.error(`[paypal-webhook] order ${order.id} belongs to provider "${order.provider}", refusing paypal capture ${resource.id}`)
    // Permanent: this order will never become a PayPal order on retry.
    return { received: true }
  }

  // Idempotent no-op, not a failure: the return route may have already
  // completed this order (it races this webhook by design), or this is a
  // genuine PayPal redelivery of an event we already processed.
  if (order.status === 'completed') {
    return { received: true }
  }

  if (resource.status !== 'COMPLETED') {
    console.error(`[paypal-webhook] capture ${resource.id} for order ${order.id} has status "${resource.status}", not COMPLETED`)
    // Permanent for this specific event; a genuine completion arrives as its
    // own PAYMENT.CAPTURE.COMPLETED event later if the capture eventually succeeds.
    return { received: true }
  }

  const capturedCurrency = resource.amount?.currency_code
  if (
    order.currency !== 'EUR'
    || capturedCurrency !== order.currency
    || !paypalAmountMatchesOrder(order.amount, resource.amount?.value)
  ) {
    console.error(
      `[paypal-webhook] amount/currency mismatch for order ${order.id}: expected ${order.amount} ${order.currency}, `
      + `got ${resource.amount?.value} ${capturedCurrency} (capture ${resource.id})`
    )
    // Permanent: the same mismatch recurs on every redelivery of this event.
    return { received: true }
  }

  const now = new Date().toISOString()
  const result = await db
    .prepare(
      `UPDATE orders SET status = 'completed', provider_reference = ?, updated_at = ?
       WHERE id = ? AND provider = 'paypal' AND status != 'completed'`
    )
    .bind(resource.id, now, order.id)
    .run()

  if (!result.meta?.changes) {
    // Zero rows can mean a concurrent completion (the return route won the
    // race) -- re-check before treating this as a failure.
    const recheck = await db.prepare('SELECT status FROM orders WHERE id = ?').bind(order.id).first<{ status: string }>()
    if (recheck?.status === 'completed') {
      return { received: true }
    }
    console.error(`[paypal-webhook] completion UPDATE affected 0 rows for order ${order.id} (recheck status: ${recheck?.status})`)
    // Ambiguous, not provably permanent -- let PayPal retry.
    throw createError({ statusCode: 500, statusMessage: 'Order completion failed.' })
  }

  return { received: true }
})
