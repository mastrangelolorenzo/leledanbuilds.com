import { verifySessionToken } from './session'
import { getSessionSecret } from './env'

export async function requireAdmin(event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never) {
  const token = getCookie(event, 'session')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const secret = getSessionSecret(event)
  const session = await verifySessionToken(token, secret)
  if (!session || session.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  return session
}
