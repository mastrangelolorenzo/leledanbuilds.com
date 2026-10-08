import { verifyPassword } from '../../utils/password'
import { createSessionToken } from '../../utils/session'
import { getSessionSecret } from '../../utils/env'
import { enforceRateLimit, enforceRateLimitByIp } from '../../utils/enforceRateLimit'
import { RATE_LIMITS, emailKey } from '../../utils/rateLimit'

interface UserRow {
  id: number
  password_hash: string
  salt: string
  role: 'admin' | 'user'
  email_verified: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required.' })
  }

  // Two independent counters, because each alone leaves a gap: per-IP stops
  // one host spraying many accounts, per-email stops a distributed attempt at
  // one account. Both run only after the 400 above, so a malformed request
  // cannot be used to burn down someone else's email counter.
  await enforceRateLimitByIp(event, RATE_LIMITS.login)
  await enforceRateLimit(event, RATE_LIMITS.login, emailKey(email))

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const user = await db
    .prepare('SELECT id, password_hash, salt, role, email_verified FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>()

  if (!user || !(await verifyPassword(password, user.password_hash, user.salt))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' })
  }

  if (user.role !== 'admin' && !user.email_verified) {
    throw createError({ statusCode: 403, statusMessage: 'Please verify your email before logging in.' })
  }

  const secret = getSessionSecret(event)
  const token = await createSessionToken({ userId: user.id, role: user.role }, secret)

  setCookie(event, 'session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return { success: true, role: user.role }
})
