import { requireAuth } from '../../utils/requireAuth'
import { createPayPalOrder, getPayPalAccessToken } from '../../lib/paypal'
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
  const clientId = event.context.cloudflare?.env?.PAYPAL_CLIENT_ID
  const clientSecret = event.context.cloudflare?.env?.PAYPAL_CLIENT_SECRET
  const apiBase = event.context.cloudflare?.env?.PAYPAL_API_BASE
  if (!clientId || !clientSecret || !apiBase) {
    throw createError({ statusCode: 503, statusMessage: 'PayPal is not configured.' })
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
  // PayPal is quoted the same value as a decimal string below.
  const orderResult = await db
    .prepare(
      `INSERT INTO orders (user_id, browse_item_id, provider, provider_session_id, amount, currency, status, created_at, updated_at)
       VALUES (?, ?, 'paypal', ?, ?, 'EUR', 'pending', ?, ?)`
    )
    .bind(session.userId, item.id, `pending-${crypto.randomUUID()}`, item.price, now, now)
    .run()

  const orderId = orderResult.meta.last_row_id as number

  const accessToken = await getPayPalAccessToken(apiBase, clientId, clientSecret)
  const paypalOrder = await createPayPalOrder(apiBase, accessToken, {
    amount: item.price.toFixed(2),
    currency: 'EUR',
    title: item.title,
    // PayPal appends its own `token` (= this PayPal order id) and `PayerID`
    // to this URL on redirect; the return route reads both `order_id` and
    // `token` and requires them to match the same row (see paypal-return.get.ts).
    returnUrl: `${origin}/api/checkout/paypal-return?order_id=${orderId}`,
    cancelUrl: `${origin}/browse/${encodeURIComponent(item.slug)}?checkout=cancelled`,
    // Our own order id is already known at this point (the row above is
    // inserted before this call), so it can ride along as custom_id -- the
    // webhook's fallback correlation key if related_ids.order_id is ever
    // absent on the capture event.
    customId: String(orderId),
  })

  await db
    .prepare('UPDATE orders SET provider_session_id = ? WHERE id = ?')
    .bind(paypalOrder.id, orderId)
    .run()

  return { url: paypalOrder.approveUrl }
})
