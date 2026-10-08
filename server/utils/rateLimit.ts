// server/utils/rateLimit.ts
//
// Rate-limit rules and key derivation. The enforcement itself lives in
// ./enforceRateLimit.ts, which does the increment and the allow/deny
// decision in a single D1 statement -- deliberately NOT mirrored by a pure
// decision function here, so the window arithmetic has exactly one home.
//
// Fixed window, not sliding: a sliding window needs either a row per request
// or a sorted-set store, and the thing being defended here (password
// guessing, mail flooding) does not care about the 2x burst a fixed window
// allows at a boundary. 8 attempts per 15 minutes degrades to at worst 16 in
// a 15-minute span straddling the boundary, which still shuts down guessing.

export type RateLimitRule = {
  // Namespace for the counter, so two different limits on the same IP do not
  // share a bucket.
  bucket: string
  limit: number
  windowSeconds: number
}

// The rules in use. Centralised so the limits are reviewable in one place
// rather than scattered as literals across route handlers.
export const RATE_LIMITS = {
  // Password guessing. Applied per IP *and* per email in
  // server/api/auth/login.post.ts, so neither a single IP spraying many
  // accounts nor many IPs targeting one account gets a free pass.
  login: { bucket: 'login', limit: 8, windowSeconds: 15 * 60 },
  // Account creation: each one sends a verification email, so this is also
  // the guard on using the site as a mail relay.
  register: { bucket: 'register', limit: 5, windowSeconds: 60 * 60 },
  // The contact form sends mail to the owner's inbox on every submission.
  contact: { bucket: 'contact', limit: 5, windowSeconds: 60 * 60 },
  // Checkout creates a provider session (an outbound API call) per attempt.
  checkout: { bucket: 'checkout', limit: 15, windowSeconds: 15 * 60 },
} as const satisfies Record<string, RateLimitRule>

// Best-effort client IP. CF-Connecting-IP is set by Cloudflare's edge and
// cannot be spoofed by the client on a request that actually reached the
// Worker through Cloudflare, which is the only way this code runs in
// production. X-Forwarded-For is NOT consulted: it is client-controlled, so
// trusting it would let an attacker rotate their own rate-limit key at will
// and bypass every limit here.
export function clientIpKey(header: string | undefined | null): string {
  const ip = (header ?? '').trim()
  return ip.length > 0 ? ip : 'unknown'
}

// Normalises an email into a rate-limit key: lowercased and trimmed, so
// "A@b.com " and "a@b.com" share one counter instead of giving an attacker
// two buckets for the same account.
export function emailKey(email: string): string {
  return email.trim().toLowerCase()
}
