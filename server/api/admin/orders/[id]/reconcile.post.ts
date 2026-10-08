// server/api/admin/orders/[id]/reconcile.post.ts
//
// Unsticks a 'pending' order by asking Stripe what actually happened, rather
// than letting an admin flip it to 'completed' by hand.
//
// That distinction is the whole point. A button that just marks an order paid
// would be a way to hand out paid files for money that never arrived -- one
// mistaken click, or one compromised admin session, and the strongest
// guarantee in the system (nothing is delivered until the provider confirms
// settlement) is gone. Here the admin only chooses WHICH order to re-check;
// whether it completes is decided by Stripe's own answer, run through the
// same amount/currency verification the webhook uses.
//
// The normal fix for a stuck order is still to repair webhook delivery and
// let Stripe redeliver. This exists for when that is not possible: the event
// has aged out of Stripe's retry schedule, or the endpoint was misconfigured
// at the time and the delivery is gone.

import { requireAdmin } from '../../../../utils/requireAdmin'
import { retrieveStripeCheckoutSession } from '../../../../lib/stripe'
import { stripeChargeMatchesOrder } from '../../../../utils/orderVerification'

interface OrderRow {
  id: number
  provider: string
  amount: number
  currency: string
  status: string
  provider_session_id: string
  user_id: number
  browse_item_id: number
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order id.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  const secretKey = event.context.cloudflare?.env?.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw createError({ statusCode: 503, statusMessage: 'Stripe is not configured.' })
  }

  const order = await db
    .prepare(
      `SELECT id, provider, amount, currency, status, provider_session_id, user_id, browse_item_id
       FROM orders WHERE id = ?`
    )
    .bind(id)
    .first<OrderRow>()

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found.' })
  }
  if (order.provider !== 'stripe') {
    throw createError({ statusCode: 400, statusMessage: 'Only Stripe orders can be reconciled here.' })
  }
  if (order.status === 'completed') {
    return { status: 'completed', changed: false, reason: 'Order was already completed.' }
  }
  if (order.provider_session_id.startsWith('pending-')) {
    // The checkout handler died between the INSERT and the Stripe call, so
    // no session was ever created and there is nothing to ask about.
    return { status: order.status, changed: false, reason: 'No Stripe session was ever created for this order.' }
  }

  const stripeSession = await retrieveStripeCheckoutSession(secretKey, order.provider_session_id)
  if (!stripeSession) {
    throw createError({ statusCode: 502, statusMessage: 'Could not reach Stripe to verify this order.' })
  }

  // Same settlement gate as the webhook: 'paid' is the only state that means
  // the money is actually ours. An 'unpaid' delayed method has not settled.
  if (stripeSession.payment_status !== 'paid') {
    return {
      status: order.status,
      changed: false,
      reason: `Stripe reports payment_status "${stripeSession.payment_status ?? 'unknown'}" — not settled, so nothing was changed.`,
    }
  }

  if (!stripeChargeMatchesOrder(stripeSession.amount_total, stripeSession.currency, order.amount, order.currency)) {
    console.error(
      `[admin-reconcile] amount mismatch on order ${order.id}: Stripe charged ${stripeSession.amount_total} ${stripeSession.currency ?? '(missing)'}, `
      + `expected ${Math.round(order.amount * 100)} ${order.currency}`
    )
    throw createError({
      statusCode: 409,
      statusMessage: 'Stripe charged a different amount or currency than this order records. Not completing it — investigate manually.',
    })
  }

  // Same duplicate detection as the webhook: a reconcile must not silently
  // create a second owned copy without flagging the money owed back.
  const duplicate = await db
    .prepare(
      `SELECT id FROM orders
       WHERE user_id = ? AND browse_item_id = ? AND status = 'completed' AND id != ?
       LIMIT 1`
    )
    .bind(order.user_id, order.browse_item_id, order.id)
    .first<{ id: number }>()

  const now = new Date().toISOString()
  const result = await db
    .prepare(
      `UPDATE orders SET status = 'completed', provider_reference = ?, needs_refund = ?, updated_at = ?
       WHERE id = ? AND provider = 'stripe' AND status != 'completed'`
    )
    .bind(stripeSession.payment_intent ?? stripeSession.id, duplicate ? 1 : 0, now, order.id)
    .run()

  if (!result.meta?.changes) {
    // Another request (a redelivered webhook, a second click) completed it
    // in between. That is success, not an error.
    return { status: 'completed', changed: false, reason: 'Order was completed concurrently.' }
  }

  console.error(`[admin-reconcile] order ${order.id} completed from Stripe session ${stripeSession.id}`)
  return {
    status: 'completed',
    changed: true,
    duplicate: Boolean(duplicate),
    reason: duplicate
      ? `Completed, but this buyer already owned the item via order ${duplicate.id} — flagged as needing a refund.`
      : 'Completed: Stripe confirms this payment settled.',
  }
})
