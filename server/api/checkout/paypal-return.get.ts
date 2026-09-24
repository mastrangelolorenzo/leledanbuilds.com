import { capturePayPalOrder, getPayPalAccessToken, paypalAmountMatchesOrder } from '../../lib/paypal'
import { getPublicOrigin } from '../../utils/env'

interface OrderRow {
  id: number
  status: string
  amount: number
  currency: string
  slug: string
}

// This route is where the buyer's browser lands after approving on PayPal --
// it is a redirect target, not a JSON API. It must never dead-end on a raw
// 500: every failure past the initial validity check still sends the buyer
// somewhere sensible, because the webhook (server/api/webhooks/paypal.post.ts)
// remains the authoritative completion path and can reconcile independently
// of whatever happens here.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const orderId = Number(query.order_id)
  const paypalToken = typeof query.token === 'string' && query.token ? query.token : undefined

  const origin = getPublicOrigin(event)
  const fallbackRedirect = `${origin}/browse?checkout=pending`

  // A missing/malformed order_id or token is a clearly-invalid request --
  // there is no order-specific page to send this visitor to, and nothing
  // about it resembles a genuine PayPal redirect gone merely wrong.
  if (!Number.isInteger(orderId) || !paypalToken) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid return request.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    console.error(`[paypal-return] DB binding unavailable for order ${orderId}`)
    return sendRedirect(event, fallbackRedirect)
  }

  // Both our own order id AND PayPal's token must match the same row --
  // never look the order up by order_id alone, since that is a small,
  // guessable, sequential integer.
  const order = await db
    .prepare(
      `SELECT o.id, o.status, o.amount, o.currency, b.slug FROM orders o
       JOIN browse_items b ON b.id = o.browse_item_id
       WHERE o.id = ? AND o.provider = 'paypal' AND o.provider_session_id = ?`
    )
    .bind(orderId, paypalToken)
    .first<OrderRow>()

  if (!order) {
    console.error(`[paypal-return] no matching paypal order for id=${orderId}`)
    return sendRedirect(event, fallbackRedirect)
  }

  const itemRedirect = (status: 'success' | 'pending') =>
    `${origin}/browse/${encodeURIComponent(order.slug)}?checkout=${status}`

  // Two return-route hits can race (double-click, back-then-forward): both
  // read status = 'pending' and both call capture, but PayPal only lets one
  // capture succeed -- the loser gets a real error (e.g. 422
  // ORDER_ALREADY_CAPTURED) even though the purchase genuinely succeeded.
  // Before telling the buyer "pending", check whether a concurrent request
  // (this one, or the reconciling webhook) already completed it for real.
  const isNowCompleted = async (): Promise<boolean> => {
    // Must never throw: it is called from inside the catch block below, and
    // if D1 is what failed in the first place, a throwing recheck here would
    // escape with no outer handler -- a raw 500 at a paying customer's
    // browser, exactly what this route's header comment promises never
    // happens. "Could not confirm completion" and "not completed" lead to
    // the same friendly pending redirect either way.
    try {
      const recheck = await db.prepare('SELECT status FROM orders WHERE id = ?').bind(order.id).first<{ status: string }>()
      return recheck?.status === 'completed'
    } catch (err) {
      console.error(`[paypal-return] could not re-check order ${order.id} status: ${err instanceof Error ? err.message : String(err)}`)
      return false
    }
  }

  // Idempotent: the reconciling webhook may have already completed this
  // order (it races this route by design), or the buyer reloaded this link.
  if (order.status === 'completed') {
    return sendRedirect(event, itemRedirect('success'))
  }

  const clientId = event.context.cloudflare?.env?.PAYPAL_CLIENT_ID
  const clientSecret = event.context.cloudflare?.env?.PAYPAL_CLIENT_SECRET
  const apiBase = event.context.cloudflare?.env?.PAYPAL_API_BASE
  if (!clientId || !clientSecret || !apiBase) {
    console.error(`[paypal-return] PayPal is not configured, order ${order.id} left pending`)
    return sendRedirect(event, itemRedirect('pending'))
  }

  try {
    const accessToken = await getPayPalAccessToken(apiBase, clientId, clientSecret)
    const capture = await capturePayPalOrder(apiBase, accessToken, paypalToken)

    // Approval is not payment. CHECKOUT.ORDER.APPROVED-equivalent evidence
    // (the buyer being redirected back here at all) never completes an
    // order -- only an actual COMPLETED capture may.
    if (capture.status !== 'COMPLETED') {
      console.error(`[paypal-return] capture status "${capture.status}" (not COMPLETED) for order ${order.id}, paypal order ${paypalToken}`)
      // A non-COMPLETED response here can be the loser of a capture race
      // (e.g. PayPal's 422 ORDER_ALREADY_CAPTURED surfaces this way too, via
      // the catch block below) -- the order may already be genuinely paid.
      if (await isNowCompleted()) {
        return sendRedirect(event, itemRedirect('success'))
      }
      return sendRedirect(event, itemRedirect('pending'))
    }

    if (
      order.currency !== 'EUR'
      || capture.currencyCode !== order.currency
      || !paypalAmountMatchesOrder(order.amount, capture.amountValue)
    ) {
      console.error(
        `[paypal-return] amount/currency mismatch for order ${order.id}: expected ${order.amount} ${order.currency}, `
        + `got ${capture.amountValue} ${capture.currencyCode} (capture ${capture.captureId})`
      )
      // The webhook remains authoritative and will independently refuse the
      // same mismatch, so this is recoverable rather than fatal here.
      return sendRedirect(event, itemRedirect('pending'))
    }

    const now = new Date().toISOString()
    const result = await db
      .prepare(
        `UPDATE orders SET status = 'completed', provider_reference = ?, updated_at = ?
         WHERE id = ? AND provider = 'paypal' AND status != 'completed'`
      )
      .bind(capture.captureId, now, order.id)
      .run()

    if (!result.meta?.changes) {
      // Zero rows can mean a concurrent completion (the webhook won the
      // race) -- re-check before treating this as a failure.
      const recheck = await db.prepare('SELECT status FROM orders WHERE id = ?').bind(order.id).first<{ status: string }>()
      if (recheck?.status !== 'completed') {
        console.error(`[paypal-return] completion UPDATE affected 0 rows for order ${order.id} (recheck status: ${recheck?.status})`)
        return sendRedirect(event, itemRedirect('pending'))
      }
    }

    return sendRedirect(event, itemRedirect('success'))
  } catch (err) {
    console.error(`[paypal-return] unexpected error capturing order ${order.id}: ${err instanceof Error ? err.message : String(err)}`)
    // The most likely real-world cause is the capture race described above:
    // a concurrent hit already captured successfully and this request's own
    // capture call failed (e.g. PayPal's 422 ORDER_ALREADY_CAPTURED) only
    // because it lost the race, not because the purchase failed.
    if (await isNowCompleted()) {
      return sendRedirect(event, itemRedirect('success'))
    }
    return sendRedirect(event, itemRedirect('pending'))
  }
})
