import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password hashing', () => {
  it('produces a hash and salt that verify() accepts for the right password', async () => {
    const { hash, salt } = await hashPassword('correct-horse-battery-staple')

    expect(await verifyPassword('correct-horse-battery-staple', hash, salt)).toBe(true)
  })

  it('rejects the wrong password', async () => {
    const { hash, salt } = await hashPassword('correct-horse-battery-staple')

    expect(await verifyPassword('wrong-password', hash, salt)).toBe(false)
  })

  it('produces a different salt (and hash) each time', async () => {
    const first = await hashPassword('same-password')
    const second = await hashPassword('same-password')

    expect(first.salt).not.toEqual(second.salt)
    expect(first.hash).not.toEqual(second.hash)
  })
})
