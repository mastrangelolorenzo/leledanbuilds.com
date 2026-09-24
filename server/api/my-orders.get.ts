// server/api/my-orders.get.ts
import { requireAuth } from '../utils/requireAuth'

interface OrderRow {
  id: number
  browse_item_id: number
  title: string
  image_url: string
  amount: number
  currency: string
  provider: string
  created_at: string
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  // Explicit column list, scoped to the session's own userId -- this must
  // never select browse_items.download_key (the R2 object key). That column
  // is only ever read server-side by the gated download endpoint; it never
  // travels in a response body. Only 'completed' orders are real purchases
  // (Stripe/PayPal both gate completion on real settlement/capture
  // evidence), so 'pending'/'failed' rows are excluded here too.
  // created_at ties break on id DESC so same-timestamp inserts still land
  // newest-first deterministically.
  const { results } = await db
    .prepare(
      `SELECT o.id, o.browse_item_id, b.title, b.image_url, o.amount, o.currency, o.provider, o.created_at
       FROM orders o
       JOIN browse_items b ON b.id = o.browse_item_id
       WHERE o.user_id = ? AND o.status = 'completed'
       ORDER BY o.created_at DESC, o.id DESC`
    )
    .bind(session.userId)
    .all<OrderRow>()

  // Paid content (a list of what this user bought) -- keep it out of any
  // shared/proxy cache the same way the download endpoint is.
  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  return results
})
