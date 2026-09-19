import { describe, expect, it } from 'vitest'
import { generateVerificationToken, hashToken } from './verificationToken'

describe('verification tokens', () => {
  it('generates a 64-hex-char token and a matching SHA-256 hash', async () => {
    const { token, tokenHash } = await generateVerificationToken()

    expect(token).toMatch(/^[0-9a-f]{64}$/)
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(await hashToken(token)).toBe(tokenHash)
  })

  it('generates a different token every call', async () => {
    const first = await generateVerificationToken()
    const second = await generateVerificationToken()

    expect(first.token).not.toBe(second.token)
  })

  it('hashToken is deterministic for the same input', async () => {
    const a = await hashToken('abc123')
    const b = await hashToken('abc123')

    expect(a).toBe(b)
  })
})
