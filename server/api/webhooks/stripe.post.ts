import { verifyStripeSignature } from '../../lib/stripe'
import { stripeChargeMatchesOrder } from '../../utils/orderVerification'

interface StripeEvent {
  type: string
  data: {
    object: {
      id: string
      payment_status?: string
      payment_intent?: string
      amount_total?: number
      currency?: string
      metadata?: { order_id?: string }
      // Present on Dispute objects (charge.dispute.*), not on Sessions.
      status?: string
      // Present on Charge objects (charge.refunded).
      amount_refunded?: number
    }
  }
}

interface OrderRow {
  id: number
  provider: string
  amount: number
  currency: string
  status: string
  user_id: number
  browse_item_id: number
}

// Refund and dispute events carry a Charge or a Dispute, NOT the Checkout
// Session -- so they have no metadata.order_id and must be correlated the
// other way round, through the payment_intent stored on the order as
// provider_reference when it completed.
//
// Neither handler revokes the download. That is the site's stated policy
// (see app/pages/refunds.vue): the file cannot be un-delivered once it is
// on the buyer's disk, so pretending otherwise would be theatre. What these
// do is make the money movement VISIBLE on the order, which is what the
// admin orders view reads -- previously a refund or a chargeback left no
// trace anywhere in the system.
const REFUND_AND_DISPUTE_EVENTS = [
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed',
]

export default defineEventHandler(async (event) => {
  const webhookSecret = event.context.cloudflare?.env?.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Stripe webhook is not configured.' })
  }

  const signatureHeader = getHeader(event, 'stripe-signature')
  if (!signatureHeader) {
    // A misconfigured integration (or a probe hitting this URL) could make
    // this the ONLY trace of every rejected delivery -- never let it be silent.
    console.error('[stripe-webhook] rejected: missing Stripe-Signature header')
    throw createError({ statusCode: 400, statusMessage: 'Missing Stripe-Signature header.' })
  }

  const rawBody = await readRawBody(event, 'utf8')
  if (!rawBody) {
    console.error('[stripe-webhook] rejected: empty request body')
    throw createError({ statusCode: 400, statusMessage: 'Empty request body.' })
  }

  const valid = await verifyStripeSignature(rawBody, signatureHeader, webhookSecret)
  if (!valid) {
    // A misconfigured STRIPE_WEBHOOK_SECRET would make every genuine delivery
    // fail this check -- log enough to diagnose that without ever logging
    // the signature header or secret itself.
    let context = 'body was not valid JSON'
    try {
      const parsed = JSON.parse(rawBody) as { type?: string, data?: { object?: { id?: string } } }
      context = `type=${parsed.type}, object_id=${parsed.data?.object?.id}`
    } catch {
      // keep the default context set above
    }
    console.error(`[stripe-webhook] rejected: invalid signature (${context})`)
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

  if (REFUND_AND_DISPUTE_EVENTS.includes(type) && session) {
    const db = event.context.cloudflare?.env?.DB
    if (!db) {
      console.error(`[stripe-webhook] DB binding unavailable handling ${type}`)
      // Transient: Stripe should retry once the binding is back.
      throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
    }

    // On a Charge the payment_intent field holds the intent id; on a Dispute
    // it does too. Fall back to the object's own id so a provider_reference
    // that was stored as a session id (the fallback in the completion path
    // below) can still be matched.
    const reference = session.payment_intent ?? session.id
    const order = await db
      .prepare('SELECT id FROM orders WHERE provider_reference = ? AND provider = ? LIMIT 1')
      .bind(reference, 'stripe')
      .first<{ id: number }>()

    if (!order) {
      // Not ours, or a charge from before this integration. Nothing to
      // record, and no retry will change that.
      console.error(`[stripe-webhook] ${type}: no order matches provider_reference ${reference}`)
      return { received: true }
    }

    const nowIso = new Date().toISOString()
    if (type === 'charge.refunded') {
      await db
        .prepare('UPDATE orders SET refunded_at = ?, needs_refund = 0, updated_at = ? WHERE id = ?')
        .bind(nowIso, nowIso, order.id)
        .run()
      // needs_refund is cleared because the refund has now actually
      // happened -- that flag means "money is owed back", and it no longer is.
      console.error(`[stripe-webhook] order ${order.id} refunded (reference ${reference})`)
    } else {
      // Dispute status verbatim from Stripe (needs_response, under_review,
      // won, lost, warning_*). Stored as text rather than mapped to our own
      // vocabulary so a new Stripe status cannot silently become "unknown".
      const disputeStatus = typeof session.status === 'string' ? session.status : type
      await db
        .prepare('UPDATE orders SET dispute_status = ?, updated_at = ? WHERE id = ?')
        .bind(disputeStatus, nowIso, order.id)
        .run()
      console.error(`[stripe-webhook] order ${order.id} dispute ${disputeStatus} (reference ${reference})`)
    }

    return { received: true }
  }

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
    .prepare('SELECT id, provider, amount, currency, status, user_id, browse_item_id FROM orders WHERE id = ?')
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

  // Amount and currency both verified by the shared check in
  // server/utils/orderVerification.ts -- shared with the admin reconcile
  // endpoint so a payment this path refuses cannot be forced through there.
  const expectedAmountInCents = Math.round(order.amount * 100)
  if (!stripeChargeMatchesOrder(session.amount_total, session.currency, order.amount, order.currency)) {
    // Marker kept as "amount mismatch" (even when only currency disagrees)
    // because the README's reconciliation section greps for this exact
    // string -- see the "Purchases" section.
    console.error(
      `[stripe-webhook] amount mismatch on order ${orderId}: session charged ${session.amount_total} ${session.currency ?? '(missing)'}, `
      + `expected ${expectedAmountInCents} ${order.currency}`
    )
    // Amount/currency mismatch is permanent: retrying the same event can
    // never make it match. Log loudly, but don't burn the endpoint's health
    // retrying forever.
    return { received: true }
  }

  // Does this buyer ALREADY own this item through a different order?
  //
  // The reuse path in server/api/checkout/stripe.post.ts prevents a second
  // session being minted for the same purchase, which is what stops this
  // happening going forward. This check is the safety net for the orders
  // that path cannot cover: two sessions created before it existed, or two
  // genuinely concurrent requests that both got past the reuse lookup.
  //
  // The money HAS been captured, so the order is still completed -- refusing
  // to record it would leave a real payment with no row. What changes is
  // needs_refund, which marks that this particular payment bought nothing
  // (access is boolean; they already had it) and is therefore owed back.
  const duplicate = await db
    .prepare(
      `SELECT id FROM orders
       WHERE user_id = ? AND browse_item_id = ? AND status = 'completed' AND id != ?
       LIMIT 1`
    )
    .bind(order.user_id, order.browse_item_id, orderId)
    .first<{ id: number }>()

  if (duplicate) {
    console.error(
      `[stripe-webhook] order ${orderId} is a DUPLICATE purchase: user ${order.user_id} already owns `
      + `item ${order.browse_item_id} via order ${duplicate.id}. Completing and flagging for refund.`
    )
  }

  const result = await db
    .prepare(
      `UPDATE orders SET status = 'completed', provider_reference = ?, needs_refund = ?, updated_at = ?
       WHERE id = ? AND provider = 'stripe' AND status != 'completed'`
    )
    .bind(session.payment_intent ?? session.id, duplicate ? 1 : 0, now, orderId)
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
