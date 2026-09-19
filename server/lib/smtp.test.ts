import { describe, expect, it } from 'vitest'
import { isValidEmailForHeader, buildMessage, readLine, readResponse } from './smtp'

function makeReader(chunks: string[]): ReadableStreamDefaultReader<Uint8Array> {
  const encoder = new TextEncoder()
  let i = 0
  return {
    read: async () => {
      if (i >= chunks.length) return { done: true, value: undefined }
      return { done: false, value: encoder.encode(chunks[i++]) }
    },
    releaseLock: () => {},
    cancel: async () => {},
    closed: Promise.resolve(undefined),
  } as unknown as ReadableStreamDefaultReader<Uint8Array>
}

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

describe('readLine', () => {
  it('reads a single complete line arriving in one chunk', async () => {
    const reader = makeReader(['220 greeting\r\n'])
    const buffer = { pending: '' }

    const line = await readLine(reader, buffer)

    expect(line).toBe('220 greeting')
  })

  it('reassembles a line whose bytes arrive split across multiple chunks', async () => {
    const reader = makeReader(['220 gre', 'eti', 'ng\r\n'])
    const buffer = { pending: '' }

    const line = await readLine(reader, buffer)

    expect(line).toBe('220 greeting')
  })
})

describe('readResponse', () => {
  it('handles a single-line response', async () => {
    const reader = makeReader(['220 greeting\r\n'])
    const buffer = { pending: '' }

    const response = await readResponse(reader, buffer)

    expect(response).toEqual({ code: 220, message: 'greeting' })
  })

  it('handles a multi-line response, keeping only the final line\'s message', async () => {
    const reader = makeReader(['250-first\r\n250-second\r\n250 third\r\n'])
    const buffer = { pending: '' }

    const response = await readResponse(reader, buffer)

    expect(response).toEqual({ code: 250, message: 'third' })
  })
})
