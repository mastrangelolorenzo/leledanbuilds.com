import { verifyPassword } from '../../utils/password'
import { createSessionToken } from '../../utils/session'
import { getSessionSecret } from '../../utils/env'

interface UserRow {
  id: number
  password_hash: string
  salt: string
  role: 'admin' | 'user'
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const user = await db
    .prepare('SELECT id, password_hash, salt, role FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>()

  if (!user || !(await verifyPassword(password, user.password_hash, user.salt))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' })
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
