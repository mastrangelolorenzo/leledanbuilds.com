// server/utils/enforceRateLimit.ts
//
// The I/O half of rate limiting. The counter is incremented and read back in
// ONE statement (INSERT ... ON CONFLICT ... RETURNING), so the allow/deny
// decision is made from the authoritative post-write value rather than from
// a separate earlier read. That ordering matters: with a read-then-write
// split, two concurrent requests both read count = limit - 1, both decide
// "allowed", and the limit is overshot. Here each request sees its own
// distinct post-increment count, so the Nth caller is always the one denied.

import { clientIpKey, type RateLimitRule } from './rateLimit'

// Deletes expired counters opportunistically, roughly 1 attempt in 50, so the
// table cannot grow without bound. Doing it inline on a sample of requests
// avoids needing a cron trigger for housekeeping on a tiny table.
const SWEEP_PROBABILITY = 0.02

async function sweepExpired(db: D1Database, nowSeconds: number) {
  // The longest window in use decides how far back a row can still be live;
  // anything older than a day is dead under every rule in RATE_LIMITS.
  await db
    .prepare('DELETE FROM rate_limits WHERE window_start < ?')
    .bind(nowSeconds - 60 * 60 * 24)
    .run()
}

/**
 * Enforce `rule` for `identifier`, throwing a 429 when the caller is over the
 * limit. `identifier` is whatever the rule counts per: an IP, an email, a
 * user id.
 *
 * Fails OPEN on a database error. That is a deliberate trade: a D1 hiccup
 * should not take down login for everyone, and the thing this protects
 * against (sustained guessing) needs many requests, so a briefly unavailable
 * limiter costs far less than an entirely unavailable auth endpoint. The
 * error is logged so an outage is still visible.
 */
export async function enforceRateLimit(
  event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never,
  rule: RateLimitRule,
  identifier: string
): Promise<void> {
  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) return

  const key = `${rule.bucket}:${identifier}`
  const nowSeconds = Math.floor(Date.now() / 1000)

  let row: { count: number, window_start: number } | null = null
  try {
    // The CASE expressions re-derive "is this a fresh window?" in SQL against
    // the stored row, so a window that another concurrent request already
    // rolled over is honoured rather than clobbered. count resets to 1 on a
    // fresh window and increments from the STORED value otherwise -- never
    // from a value this process read earlier.
    row = await db
      .prepare(`
        INSERT INTO rate_limits (key, count, window_start)
        VALUES (?, 1, ?)
        ON CONFLICT(key) DO UPDATE SET
          count = CASE WHEN ? - rate_limits.window_start >= ? THEN 1 ELSE rate_limits.count + 1 END,
          window_start = CASE WHEN ? - rate_limits.window_start >= ? THEN ? ELSE rate_limits.window_start END
        RETURNING count, window_start
      `)
      .bind(key, nowSeconds, nowSeconds, rule.windowSeconds, nowSeconds, rule.windowSeconds, nowSeconds)
      .first<{ count: number, window_start: number }>()

    if (Math.random() < SWEEP_PROBABILITY) {
      await sweepExpired(db, nowSeconds)
    }
  } catch (e) {
    console.error(`[rate-limit] storage error for bucket ${rule.bucket}, failing open:`, e)
    return
  }

  // No row back from RETURNING means the statement did not behave as
  // expected; treat it the same as a storage error and fail open rather than
  // locking out every caller on an unexpected driver change.
  if (!row) {
    console.error(`[rate-limit] no row returned for bucket ${rule.bucket}, failing open`)
    return
  }

  if (row.count <= rule.limit) return

  // Math.max(1, ...) guards a clock that moved backwards (NTP step): never
  // emit a zero or negative Retry-After on a rejection.
  const elapsed = nowSeconds - row.window_start
  const retryAfterSeconds = Math.max(1, rule.windowSeconds - elapsed)

  setResponseHeader(event, 'Retry-After', String(retryAfterSeconds))
  throw createError({
    statusCode: 429,
    statusMessage: 'Too many attempts. Please wait and try again.',
    data: { retryAfterSeconds },
  })
}

// Convenience wrapper for the common "limit by client IP" case.
//
// CF-Connecting-IP only: see the note on clientIpKey in ./rateLimit.ts for
// why X-Forwarded-For is deliberately not consulted.
export async function enforceRateLimitByIp(
  event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never,
  rule: RateLimitRule
): Promise<void> {
  await enforceRateLimit(event, rule, clientIpKey(getRequestHeader(event, 'cf-connecting-ip')))
}
