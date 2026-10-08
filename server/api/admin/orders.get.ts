// server/api/admin/orders.get.ts
//
// The operator's view of every payment. Before this existed there was no way
// to see that money had moved at all: a stuck 'pending' order, a duplicate
// purchase owed a refund, or a chargeback were all invisible without opening
// the database by hand.

import { requireAdmin } from '../../utils/requireAdmin'

interface OrderRow {
  id: number
  status: string
  provider: string
  provider_reference: string | null
  provider_session_id: string
  amount: number
  currency: string
  needs_refund: number
  refunded_at: string | null
  dispute_status: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
  user_id: number
  user_email: string | null
  browse_item_id: number
  item_title: string | null
  item_slug: string | null
}

// Pending orders older than this are almost certainly stuck rather than
// in-flight: a card payment completes in seconds, and the slowest delayed
// method Stripe offers here (SEPA debit) settles in days -- but the WEBHOOK
// for it arrives immediately as checkout.session.completed with
// payment_status unpaid, so a row sitting at 'pending' past this means no
// webhook ever landed. Surfaced, not auto-failed: the fix is to find out why
// webhooks stopped, not to quietly discard the order.
const STUCK_PENDING_MINUTES = 30

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  // LEFT JOIN, not JOIN: an order whose user or item row was deleted must
  // still appear here. It is a real payment, and hiding it is exactly the
  // blindness this endpoint exists to remove.
  const { results } = await db
    .prepare(`
      SELECT
        o.id, o.status, o.provider, o.provider_reference, o.provider_session_id,
        o.amount, o.currency, o.needs_refund, o.refunded_at, o.dispute_status,
        o.admin_note, o.created_at, o.updated_at,
        o.user_id, u.email AS user_email,
        o.browse_item_id, b.title AS item_title, b.slug AS item_slug
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN browse_items b ON b.id = o.browse_item_id
      ORDER BY o.id DESC
      LIMIT 500
    `)
    .all<OrderRow>()

  const rows = results ?? []
  const nowMs = Date.now()

  const orders = rows.map((r) => {
    const createdMs = Date.parse(r.created_at)
    // A created_at that will not parse must not silently become "stuck" (or
    // silently become fine) -- treat an unparseable date as not-stuck and
    // let the row show its raw timestamp to the operator.
    const ageMinutes = Number.isFinite(createdMs) ? (nowMs - createdMs) / 60000 : 0
    return {
      ...r,
      needs_refund: r.needs_refund === 1,
      is_stuck_pending: r.status === 'pending' && ageMinutes > STUCK_PENDING_MINUTES,
    }
  })

  // Counters for the page header, computed here so the UI does not have to
  // re-derive the same definitions and drift from them.
  const summary = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    failed: orders.filter(o => o.status === 'failed').length,
    stuck_pending: orders.filter(o => o.is_stuck_pending).length,
    needs_refund: orders.filter(o => o.needs_refund && !o.refunded_at).length,
    disputed: orders.filter(o => o.dispute_status && !['won', 'warning_closed'].includes(o.dispute_status)).length,
    // Gross completed revenue, in whole euros to match orders.amount. Summed
    // from integer cents so repeated float addition cannot drift (0.1 + 0.2).
    revenue_completed: orders
      .filter(o => o.status === 'completed')
      .reduce((cents, o) => cents + Math.round(o.amount * 100), 0) / 100,
  }

  return { orders, summary, stuck_pending_minutes: STUCK_PENDING_MINUTES }
})
