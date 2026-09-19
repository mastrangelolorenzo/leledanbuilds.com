import { describe, expect, it } from 'vitest'
import { getPublicOrigin } from './env'

function mockEvent(publicOrigin: string | undefined) {
  return {
    context: {
      cloudflare: {
        env: {
          PUBLIC_ORIGIN: publicOrigin,
        },
      },
    },
  } as Parameters<typeof getPublicOrigin>[0]
}

describe('getPublicOrigin', () => {
  it('strips a single trailing slash from the configured origin', () => {
    expect(getPublicOrigin(mockEvent('https://leledanbuilds.com/'))).toBe('https://leledanbuilds.com')
  })

  it('strips multiple trailing slashes from the configured origin', () => {
    expect(getPublicOrigin(mockEvent('https://leledanbuilds.com///'))).toBe('https://leledanbuilds.com')
  })

  it('leaves a configured origin without a trailing slash unchanged', () => {
    expect(getPublicOrigin(mockEvent('https://leledanbuilds.com'))).toBe('https://leledanbuilds.com')
  })
})
