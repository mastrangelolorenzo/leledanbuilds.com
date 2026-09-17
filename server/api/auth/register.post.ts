import { hashPassword } from '../../utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !email.includes('@') || !password || password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Valid email and a password of 8+ characters are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const { hash, salt } = await hashPassword(password)
  try {
    await db
      .prepare('INSERT INTO users (email, password_hash, salt, role) VALUES (?, ?, ?, ?)')
      .bind(email, hash, salt, 'user')
      .run()
  } catch (err) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists.' })
    }
    throw err
  }

  return { success: true }
})
