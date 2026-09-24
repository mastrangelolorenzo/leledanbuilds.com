import { verifyStripeSignature } from '../../lib/stripe'

interface StripeEvent {
  type: string
  data: {
    object: {
      id: string
      payment_status?: string
      payment_intent?: string
      amount_total?: number
      metadata?: { order_id?: string }
    }
  }
}

interface OrderRow {
  id: number
  provider: string
  amount: number
  status: string
}

export default defineEventHandler(async (event) => {
  const webhookSecret = event.context.cloudflare?.env?.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Stripe webhook is not configured.' })
  }

  const signatureHeader = getHeader(event, 'stripe-signature')
  if (!signatureHeader) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Stripe-Signature header.' })
  }

  const rawBody = await readRawBody(event, 'utf8')
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty request body.' })
  }

  const valid = await verifyStripeSignature(rawBody, signatureHeader, webhookSecret)
  if (!valid) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature.' })
  }

  const stripeEvent = JSON.parse(rawBody) as StripeEvent
  const type = stripeEvent.type
  const session = stripeEvent.data?.object

  const HANDLED = [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
  ]
  if (!HANDLED.includes(type) || !session) {
    return { received: true }
  }

  const orderId = Number(session.metadata?.order_id)
  if (!Number.isInteger(orderId)) {
    console.error(`[stripe-webhook] ${type} for session ${session.id} carries no usable order_id metadata`)
    // Permanent: no retry will ever produce usable metadata for this event.
    return { received: true }
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    console.error(`[stripe-webhook] DB binding unavailable handling ${type} for order ${orderId}`)
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const order = await db
    .prepare('SELECT id, provider, amount, status FROM orders WHERE id = ?')
    .bind(orderId)
    .first<OrderRow>()

  if (!order) {
    console.error(`[stripe-webhook] order ${orderId} not found for ${type}`)
    throw createError({ statusCode: 404, statusMessage: 'Order not found.' })
  }
  if (order.provider !== 'stripe') {
    console.error(`[stripe-webhook] order ${orderId} belongs to provider ${order.provider}, refusing ${type}`)
    // Permanent: this order will never become a Stripe order on retry.
    return { received: true }
  }

  const now = new Date().toISOString()

  if (type === 'checkout.session.async_payment_failed') {
    await db
      .prepare(`UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ? AND status != 'completed'`)
      .bind(now, orderId)
      .run()
    return { received: true }
  }

  // checkout.session.completed fires when the buyer submits, not when the money
  // settles: delayed methods (SEPA, Klarna, Bacs...) arrive here unpaid and settle
  // later as checkout.session.async_payment_succeeded. Only paid sessions complete.
  if (session.payment_status !== 'paid') {
    return { received: true }
  }

  if (order.status === 'completed') {
    return { received: true }
  }

  const expectedAmountInCents = Math.round(order.amount * 100)
  if (typeof session.amount_total === 'number' && session.amount_total !== expectedAmountInCents) {
    console.error(
      `[stripe-webhook] amount mismatch on order ${orderId}: session charged ${session.amount_total}, expected ${expectedAmountInCents}`
    )
    // Amount mismatch is permanent: retrying the same event can never make it
    // match. Log loudly, but don't burn the endpoint's health retrying forever.
    return { received: true }
  }

  const result = await db
    .prepare(
      `UPDATE orders SET status = 'completed', provider_reference = ?, updated_at = ?
       WHERE id = ? AND provider = 'stripe' AND status != 'completed'`
    )
    .bind(session.payment_intent ?? session.id, now, orderId)
    .run()

  if (!result.meta?.changes) {
    const recheck = await db
      .prepare('SELECT status FROM orders WHERE id = ?')
      .bind(orderId)
      .first<{ status: string }>()
    if (recheck?.status === 'completed') {
      return { received: true }
    }
    console.error(`[stripe-webhook] completion UPDATE affected 0 rows for order ${orderId}`)
    throw createError({ statusCode: 500, statusMessage: 'Order completion failed.' })
  }

  return { received: true }
})
