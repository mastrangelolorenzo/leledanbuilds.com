import { hashToken } from '../../utils/verificationToken'
import { getPublicOrigin } from '../../utils/env'

interface TokenRow {
  user_id: number
  expires_at: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token : ''
  const origin = getPublicOrigin(event)

  if (!token) {
    return sendRedirect(event, `${origin}/app/login?verify_error=1`)
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const tokenHash = await hashToken(token)
  const row = await db
    .prepare('SELECT user_id, expires_at FROM email_verification_tokens WHERE token_hash = ?')
    .bind(tokenHash)
    .first<TokenRow>()

  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return sendRedirect(event, `${origin}/app/login?verify_error=1`)
  }

  await db.batch([
    db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').bind(row.user_id),
    db.prepare('DELETE FROM email_verification_tokens WHERE token_hash = ?').bind(tokenHash),
  ])

  return sendRedirect(event, `${origin}/app/login?verified=1`)
})
