import { describe, expect, it } from 'vitest'
import { createSessionToken, verifySessionToken } from './session'

const SECRET = 'test-secret-at-least-32-bytes-long-xxxx'

describe('session tokens', () => {
  it('round-trips a valid payload', async () => {
    const token = await createSessionToken({ userId: 1, role: 'admin' }, SECRET)

    const payload = await verifySessionToken(token, SECRET)

    expect(payload).toEqual({ userId: 1, role: 'admin' })
  })

  it('returns null for a token signed with a different secret', async () => {
    const token = await createSessionToken({ userId: 1, role: 'user' }, SECRET)

    const payload = await verifySessionToken(token, 'a-completely-different-secret-xx')

    expect(payload).toBeNull()
  })

  it('returns null for garbage input', async () => {
    expect(await verifySessionToken('not-a-jwt', SECRET)).toBeNull()
  })
})
