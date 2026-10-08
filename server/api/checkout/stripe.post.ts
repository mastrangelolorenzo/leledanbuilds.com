import { requireAuth } from '../../utils/requireAuth'
import { createStripeCheckoutSession, retrieveStripeCheckoutSession } from '../../lib/stripe'
import { getPublicOrigin } from '../../utils/env'
import { enforceRateLimit } from '../../utils/enforceRateLimit'
import { RATE_LIMITS } from '../../utils/rateLimit'

interface Body {
  browse_item_id: number
}

interface ItemRow {
  id: number
  slug: string
  title: string
  price: number
  download_key: string | null
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readBody<Body>(event)

  if (!body?.browse_item_id || !Number.isInteger(body.browse_item_id)) {
    throw createError({ statusCode: 400, statusMessage: 'browse_item_id is required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  const secretKey = event.context.cloudflare?.env?.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw createError({ statusCode: 503, statusMessage: 'Stripe is not configured.' })
  }
  const bucket = event.context.cloudflare?.env?.UPLOADS
  if (!bucket) {
    throw createError({ statusCode: 503, statusMessage: 'Upload storage unavailable' })
  }

  const item = await db
    .prepare('SELECT id, slug, title, price, download_key FROM browse_items WHERE id = ?')
    .bind(body.browse_item_id)
    .first<ItemRow>()

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item not found.' })
  }
  if (!item.download_key) {
    throw createError({ statusCode: 409, statusMessage: 'This item is not yet available for purchase.' })
  }

  // The DB row can point at an R2 object that was deleted (or never
  // uploaded successfully) -- confirm it genuinely exists before ever
  // taking the customer's money, not just that download_key is non-empty.
  const deliverable = await bucket.head(item.download_key)
  if (!deliverable) {
    console.error(`[stripe-checkout] download_key "${item.download_key}" for item ${item.id} not found in R2, refusing checkout`)
    throw createError({ statusCode: 409, statusMessage: 'This item is not yet available for purchase.' })
  }

  // requireAuth only proves the session cookie is a validly-signed JWT --
  // it does not prove the userId inside it still exists (e.g. a token
  // minted by a different environment, or an account deleted after the
  // session was issued). Without this, the INSERT below fails its FOREIGN
  // KEY constraint and the buyer sees a bare "Server Error" on the Buy
  // button instead of an actionable message.
  const user = await db
    .prepare('SELECT id FROM users WHERE id = ?')
    .bind(session.userId)
    .first<{ id: number }>()

  if (!user) {
    console.error(`[stripe-checkout] session references missing user ${session.userId}`)
    throw createError({ statusCode: 401, statusMessage: 'Your session is no longer valid. Please log in again.' })
  }

  // Refunds do not revoke access (see server/api/webhooks/stripe.post.ts),
  // so a second completed purchase of the same item is pure loss for the
  // buyer. Match on status = 'completed' ONLY -- a 'pending' order is an
  // abandoned or in-flight attempt and a 'failed' one means the payment
  // never went through, and in both cases the customer must be able to
  // try again.
  const existing = await db
    .prepare(`SELECT id FROM orders WHERE user_id = ? AND browse_item_id = ? AND status = 'completed' LIMIT 1`)
    .bind(session.userId, item.id)
    .first<{ id: number }>()

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'You already own this build — you can download it from My Purchases.',
    })
  }

  // Reuse a still-open Checkout Session instead of creating a second one.
  //
  // This is what actually closes the double-purchase hole. The 'completed'
  // check above cannot: it is satisfied for as long as the first order sits
  // at 'pending', so a second click (another tab, an impatient retry, a
  // double-submit) used to mint a SECOND session and a SECOND order, and
  // paying both produced two completed orders for one item. That is not a
  // millisecond race -- the window lasts as long as the buyer takes to pay.
  // This database has three completed orders for one (user, item) pair from
  // exactly that path.
  //
  // Reuse, rather than refusing the second attempt: refusing would strand a
  // buyer who abandoned Stripe and came back, and Checkout Sessions stay
  // open for 24h, so handing back the same session is both safe and the
  // better experience. Paying the same session twice is impossible -- Stripe
  // itself closes it on completion.
  const openOrder = await db
    .prepare(
      `SELECT id, provider_session_id FROM orders
       WHERE user_id = ? AND browse_item_id = ? AND provider = 'stripe' AND status = 'pending'
       ORDER BY id DESC LIMIT 1`
    )
    .bind(session.userId, item.id)
    .first<{ id: number, provider_session_id: string }>()

  if (openOrder) {
    // A provider_session_id still carrying the 'pending-' placeholder means
    // the previous attempt died between the INSERT and the Stripe call, so
    // there is no session to reuse -- fall through and make a new one.
    const isRealSession = !openOrder.provider_session_id.startsWith('pending-')
    if (isRealSession) {
      const existingSession = await retrieveStripeCheckoutSession(secretKey, openOrder.provider_session_id)
      // Only 'open' is reusable: 'complete' means the webhook simply has not
      // landed yet, and 'expired' means Stripe will never accept it again.
      if (existingSession?.status === 'open' && existingSession.url) {
        return { url: existingSession.url }
      }
      if (existingSession?.status === 'expired') {
        // Retire it so this lookup does not keep finding the same dead row
        // on every future attempt.
        await db
          .prepare(`UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'pending'`)
          .bind(new Date().toISOString(), openOrder.id)
          .run()
      }
    }
  }

  // Only now, past every cheap rejection and the reuse path, does an attempt
  // cost us an outbound Stripe call -- so this is where it is worth counting.
  await enforceRateLimit(event, RATE_LIMITS.checkout, String(session.userId))

  const origin = getPublicOrigin(event)
  const now = new Date().toISOString()

  // orders.amount is stored in whole euros (matching browse_items.price);
  // Stripe is charged in cents below via Math.round(item.price * 100).
  const orderResult = await db
    .prepare(
      `INSERT INTO orders (user_id, browse_item_id, provider, provider_session_id, amount, currency, status, created_at, updated_at)
       VALUES (?, ?, 'stripe', ?, ?, 'EUR', 'pending', ?, ?)`
    )
    .bind(session.userId, item.id, `pending-${crypto.randomUUID()}`, item.price, now, now)
    .run()

  const orderId = orderResult.meta.last_row_id as number

  const checkoutSession = await createStripeCheckoutSession(secretKey, {
    title: item.title,
    unitAmount: Math.round(item.price * 100),
    currency: 'eur',
    quantity: 1,
    successUrl: `${origin}/browse/${encodeURIComponent(item.slug)}?checkout=success`,
    cancelUrl: `${origin}/browse/${encodeURIComponent(item.slug)}?checkout=cancelled`,
    metadata: { order_id: String(orderId) },
  })

  await db
    .prepare('UPDATE orders SET provider_session_id = ? WHERE id = ?')
    .bind(checkoutSession.id, orderId)
    .run()

  return { url: checkoutSession.url }
})
