import { verifySessionToken } from '../../utils/session'
import { getSessionSecret } from '../../utils/env'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const secret = getSessionSecret(event)
  const session = await verifySessionToken(token, secret)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  return session
})
