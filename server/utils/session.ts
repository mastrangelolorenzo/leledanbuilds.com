import { SignJWT, jwtVerify } from 'jose'

export interface SessionPayload {
  userId: number
  role: 'admin' | 'user'
}

function encodeSecret(secret: string) {
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(payload: SessionPayload, secret: string): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(encodeSecret(secret))
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodeSecret(secret))
    if (typeof payload.userId !== 'number' || (payload.role !== 'admin' && payload.role !== 'user')) {
      return null
    }
    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}
