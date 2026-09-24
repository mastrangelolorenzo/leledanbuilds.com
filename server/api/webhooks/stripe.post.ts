import { verifyStripeSignature } from '../../lib/stripe'

interface StripeEvent {
  type: string
  data: {
    object: {
      id: string
      payment_intent?: string
      metadata?: { order_id?: string }
    }
  }
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

  if (stripeEvent.type === 'checkout.session.completed') {
    const orderId = stripeEvent.data.object.metadata?.order_id
    if (orderId) {
      const db = event.context.cloudflare?.env?.DB
      if (db) {
        await db
          .prepare(`UPDATE orders SET status = 'completed', provider_reference = ?, updated_at = ? WHERE id = ? AND status != 'completed'`)
          .bind(stripeEvent.data.object.payment_intent ?? stripeEvent.data.object.id, new Date().toISOString(), Number(orderId))
          .run()
      }
    }
  }

  return { received: true }
})
