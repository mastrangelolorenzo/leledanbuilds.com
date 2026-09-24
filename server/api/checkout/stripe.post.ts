import { requireAuth } from '../../utils/requireAuth'
import { createStripeCheckoutSession } from '../../lib/stripe'
import { getPublicOrigin } from '../../utils/env'

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
