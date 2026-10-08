// server/api/admin/stats.get.ts
//
// Everything the owner wants to see at a glance: who has signed up, what has
// sold, and how much content exists.
//
// One endpoint with a batch of counts rather than several endpoints, so the
// dashboard is a single round trip. D1's batch() runs these in one call --
// a dashboard that issued a dozen sequential queries would be noticeably
// slow on a cold Worker.

import { requireAdmin } from '../../utils/requireAdmin'

// "New" window for signups and sales, in days.
const RECENT_DAYS = 30
const WEEK_DAYS = 7

// Reads the single value out of one batch result, defaulting to 0 rather
// than throwing: one unexpected shape should not blank the whole dashboard.
function count(result: unknown): number {
  const rows = (result as { results?: { n?: unknown }[] } | undefined)?.results
  const n = rows?.[0]?.n
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function sum(result: unknown): number {
  const rows = (result as { results?: { total?: unknown }[] } | undefined)?.results
  const total = rows?.[0]?.total
  return typeof total === 'number' && Number.isFinite(total) ? total : 0
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  // ISO strings rather than SQLite date functions, so the cutoffs match
  // exactly how created_at is written (strftime('%Y-%m-%dT%H:%M:%fZ')) and
  // compare as plain lexicographic text -- which works because every
  // timestamp in this schema is UTC and fixed-width.
  const nowMs = Date.now()
  const recentCutoff = new Date(nowMs - RECENT_DAYS * 86400_000).toISOString()
  const weekCutoff = new Date(nowMs - WEEK_DAYS * 86400_000).toISOString()

  const results = await db.batch([
    // -- People --
    db.prepare(`SELECT COUNT(*) AS n FROM users`),
    db.prepare(`SELECT COUNT(*) AS n FROM users WHERE email_verified = 1`),
    db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin'`),
    db.prepare(`SELECT COUNT(*) AS n FROM users WHERE created_at >= ?`).bind(weekCutoff),
    db.prepare(`SELECT COUNT(*) AS n FROM users WHERE created_at >= ?`).bind(recentCutoff),
    // Customers, i.e. people who have actually bought something -- distinct
    // from registered users, most of whom never will.
    db.prepare(`SELECT COUNT(DISTINCT user_id) AS n FROM orders WHERE status = 'completed'`),

    // -- Sales --
    db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE status = 'completed'`),
    // SUM over whole euros; COALESCE because SUM of no rows is NULL, which
    // would otherwise come back as 0 anyway but only by accident.
    db.prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'completed'`),
    db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE status = 'completed' AND created_at >= ?`).bind(recentCutoff),
    db.prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'completed' AND created_at >= ?`).bind(recentCutoff),
    db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'`),
    db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE needs_refund = 1 AND refunded_at IS NULL`),
    db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE dispute_status IS NOT NULL`),

    // -- Content --
    db.prepare(`SELECT COUNT(*) AS n FROM browse_items`),
    db.prepare(`SELECT COUNT(*) AS n FROM browse_items WHERE download_key IS NOT NULL AND download_key != ''`),
    db.prepare(`SELECT COUNT(*) AS n FROM posts`),
    db.prepare(`SELECT COUNT(*) AS n FROM reviews`),
    db.prepare(`SELECT COUNT(*) AS n FROM browse_item_likes`),
  ])

  const [
    usersTotal, usersVerified, usersAdmin, usersWeek, usersMonth, customers,
    salesCount, salesRevenue, salesCountRecent, salesRevenueRecent,
    ordersPending, ordersNeedRefund, ordersDisputed,
    itemsTotal, itemsSellable, postsTotal, reviewsTotal, likesTotal,
  ] = results

  // Best sellers, listed separately because it returns rows rather than a
  // single number. LEFT JOIN so an order whose item was deleted still counts
  // toward nothing silently rather than vanishing from the totals above.
  const { results: topRows } = await db
    .prepare(`
      SELECT b.id, b.title, b.slug, COUNT(o.id) AS sales, COALESCE(SUM(o.amount), 0) AS revenue
      FROM orders o
      JOIN browse_items b ON b.id = o.browse_item_id
      WHERE o.status = 'completed'
      GROUP BY b.id, b.title, b.slug
      ORDER BY sales DESC, revenue DESC
      LIMIT 5
    `)
    .all<{ id: number, title: string, slug: string, sales: number, revenue: number }>()

  // Signups per day over the last week, for a small trend readout. Grouped
  // on the date prefix of the ISO timestamp, which is valid because every
  // created_at is UTC and fixed-width.
  const { results: signupRows } = await db
    .prepare(`
      SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS n
      FROM users
      WHERE created_at >= ?
      GROUP BY day
      ORDER BY day ASC
    `)
    .bind(weekCutoff)
    .all<{ day: string, n: number }>()

  const totalUsers = count(usersTotal)
  const verified = count(usersVerified)

  return {
    users: {
      total: totalUsers,
      verified,
      // Derived rather than queried: one fewer round trip, and it can never
      // disagree with the two numbers it is derived from.
      unverified: Math.max(0, totalUsers - verified),
      admins: count(usersAdmin),
      new_this_week: count(usersWeek),
      new_this_month: count(usersMonth),
      customers: count(customers),
    },
    sales: {
      count: count(salesCount),
      revenue: sum(salesRevenue),
      count_this_month: count(salesCountRecent),
      revenue_this_month: sum(salesRevenueRecent),
      pending: count(ordersPending),
      needs_refund: count(ordersNeedRefund),
      disputed: count(ordersDisputed),
      // Share of registered users who bought something, as a percentage with
      // one decimal. Guarded against division by zero on an empty site.
      conversion_percent: totalUsers > 0
        ? Math.round((count(customers) / totalUsers) * 1000) / 10
        : 0,
    },
    content: {
      browse_items: count(itemsTotal),
      browse_items_sellable: count(itemsSellable),
      posts: count(postsTotal),
      reviews: count(reviewsTotal),
      likes: count(likesTotal),
    },
    top_sellers: topRows ?? [],
    signups_per_day: signupRows ?? [],
    windows: { recent_days: RECENT_DAYS, week_days: WEEK_DAYS },
  }
})
