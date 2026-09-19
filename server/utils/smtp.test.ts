import { describe, expect, it } from 'vitest'
import { isValidEmailForHeader, buildMessage } from './smtp'

describe('isValidEmailForHeader', () => {
  it('accepts a normal email address', () => {
    expect(isValidEmailForHeader('user@example.com')).toBe(true)
  })

  it('rejects an address containing a carriage return (header injection attempt)', () => {
    expect(isValidEmailForHeader('user@example.com\r\nBcc: victim@evil.com')).toBe(false)
  })

  it('rejects an address containing a newline', () => {
    expect(isValidEmailForHeader('user@example.com\nBcc: victim@evil.com')).toBe(false)
  })

  it('rejects an address with no @ or with spaces', () => {
    expect(isValidEmailForHeader('not an email')).toBe(false)
    expect(isValidEmailForHeader('missing-at-sign.com')).toBe(false)
  })
})

describe('buildMessage', () => {
  it('builds a well-formed message with CRLF line endings', () => {
    const msg = buildMessage({ from: 'a@example.com', to: 'b@example.com', subject: 'Hi', text: 'Hello there' })

    expect(msg).toContain('From: a@example.com\r\n')
    expect(msg).toContain('To: b@example.com\r\n')
    expect(msg).toContain('Subject: Hi\r\n')
    expect(msg).toContain('Hello there')
  })

  it('strips CR/LF from the subject line so a malicious subject cannot inject headers', () => {
    const msg = buildMessage({ from: 'a@example.com', to: 'b@example.com', subject: 'Hi\r\nBcc: victim@evil.com', text: 'body' })

    expect(msg).not.toContain('Bcc:')
  })

  it('throws if the "to" address fails isValidEmailForHeader', () => {
    expect(() => buildMessage({ from: 'a@example.com', to: 'bad\r\naddress', subject: 'Hi', text: 'body' })).toThrow()
  })
})
