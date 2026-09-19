import { hashPassword } from '../../utils/password'
import { isUniqueConstraintError } from '../../utils/postValidation'
import { generateVerificationToken } from '../../utils/verificationToken'
import { sendMail, isValidEmailForHeader } from '../../lib/smtp'
import { getPublicOrigin } from '../../utils/env'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !isValidEmailForHeader(email) || !password || password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Valid email and a password of 8+ characters are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const { hash, salt } = await hashPassword(password)

  let userId: number
  try {
    const result = await db
      .prepare('INSERT INTO users (email, password_hash, salt, role) VALUES (?, ?, ?, ?)')
      .bind(email, hash, salt, 'user')
      .run()
    userId = result.meta.last_row_id as number
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists.' })
    }
    throw err
  }

  const { token, tokenHash } = await generateVerificationToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await db
    .prepare('INSERT INTO email_verification_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(tokenHash, userId, expiresAt)
    .run()

  const origin = getPublicOrigin(event)
  const verifyUrl = `${origin}/api/auth/verify?token=${token}`

  try {
    await sendMail(event.context.cloudflare.env, {
      to: email,
      subject: 'Verify your leledanbuilds account',
      text: `Welcome! Click the link below to verify your email and activate your account:\n\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create this account, you can ignore this email.`,
    })
  } catch (err) {
    // Registration itself already succeeded (the row exists) — a delivery
    // failure shouldn't look like registration failed. Surface it as a
    // concern via DONE_WITH_CONCERNS in your report; the user can still use
    // resend-verification once SMTP is working.
    console.error('Failed to send verification email:', err)
  }

  return { success: true, message: 'Account created. Check your email to verify your account before logging in.' }
})
