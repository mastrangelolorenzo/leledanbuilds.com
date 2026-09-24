import { describe, expect, it } from 'vitest'
import { verifyStripeSignature } from './stripe'

async function signPayload(secret: string, timestamp: number, payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${payload}`))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

describe('verifyStripeSignature', () => {
  const secret = 'whsec_test_secret'
  const payload = '{"id":"evt_123"}'

  it('accepts a correctly signed, fresh payload', async () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const v1 = await signPayload(secret, timestamp, payload)
    expect(await verifyStripeSignature(payload, `t=${timestamp},v1=${v1}`, secret)).toBe(true)
  })

  it('rejects a payload signed with the wrong secret', async () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const v1 = await signPayload('wrong-secret', timestamp, payload)
    expect(await verifyStripeSignature(payload, `t=${timestamp},v1=${v1}`, secret)).toBe(false)
  })

  it('rejects a stale timestamp outside the tolerance window', async () => {
    const timestamp = Math.floor(Date.now() / 1000) - 1000
    const v1 = await signPayload(secret, timestamp, payload)
    expect(await verifyStripeSignature(payload, `t=${timestamp},v1=${v1}`, secret)).toBe(false)
  })

  it('rejects a malformed header', async () => {
    expect(await verifyStripeSignature(payload, 'not-a-valid-header', secret)).toBe(false)
  })

  it('rejects a tampered payload even with a validly-formed signature for different content', async () => {
    const timestamp = Math.floor(Date.now() / 1000)
    const v1 = await signPayload(secret, timestamp, payload)
    expect(await verifyStripeSignature('{"id":"evt_999"}', `t=${timestamp},v1=${v1}`, secret)).toBe(false)
  })
})
