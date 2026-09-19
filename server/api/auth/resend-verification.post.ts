import { generateVerificationToken } from '../../utils/verificationToken'
import { sendMail } from '../../utils/smtp'

interface UserRow {
  id: number
  email_verified: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = body.email?.trim().toLowerCase()

  // Generic response either way — this route must not reveal whether an
  // email is registered (unlike register's 409, which already discloses
  // existence; resend is a repeatable, unauthenticated action and doesn't
  // need to, so it doesn't).
  const genericResponse = { success: true, message: 'If that account exists and needs verification, a new email has been sent.' }

  if (!email) return genericResponse

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const user = await db
    .prepare('SELECT id, email_verified FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>()

  if (!user || user.email_verified) {
    return genericResponse
  }

  await db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').bind(user.id).run()

  const { token, tokenHash } = await generateVerificationToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await db
    .prepare('INSERT INTO email_verification_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(tokenHash, user.id, expiresAt)
    .run()

  const origin = getRequestURL(event).origin
  const verifyUrl = `${origin}/api/auth/verify?token=${token}`

  try {
    await sendMail(event.context.cloudflare.env, {
      to: email,
      subject: 'Verify your leledanbuilds account',
      text: `Click the link below to verify your email and activate your account:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    })
  } catch (err) {
    console.error('Failed to resend verification email:', err)
  }

  return genericResponse
})
