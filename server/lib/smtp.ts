import { connect } from 'cloudflare:sockets'

const SMTP_HOST = 'smtp.gmail.com'
const SMTP_PORT = 465

export function isValidEmailForHeader(email: string): boolean {
  if (/[\r\n]/.test(email)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Truncates at the first CR or LF rather than merely filtering CR/LF
// characters out. A header-injection attempt in the subject (e.g.
// "Hi\r\nBcc: victim@evil.com") must have its entire injected payload
// discarded, not just the newline glued back together with the legitimate
// text and the attacker-controlled remainder left intact.
function stripCrlf(value: string): string {
  const index = value.search(/[\r\n]/)
  return index === -1 ? value : value.slice(0, index)
}

export function buildMessage(opts: { from: string, to: string, subject: string, text: string, replyTo?: string }): string {
  if (!isValidEmailForHeader(opts.to)) {
    throw new Error('Invalid recipient email address.')
  }
  if (!isValidEmailForHeader(opts.from)) {
    throw new Error('Invalid sender email address.')
  }
  if (opts.replyTo && !isValidEmailForHeader(opts.replyTo)) {
    throw new Error('Invalid reply-to email address.')
  }

  const subject = stripCrlf(opts.subject)
  // Body lines are dot-stuffed per RFC 5321: a line starting with "." gets
  // an extra "." prepended, so it's never mistaken for the end-of-DATA marker.
  // Split on an optional \r so callers passing \r\n-delimited text don't end
  // up with a stray bare \r glued onto the end of every line.
  const body = opts.text
    .split(/\r?\n/)
    .map(line => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n')

  return [
    `From: ${opts.from}\r\n`,
    `To: ${opts.to}\r\n`,
    ...(opts.replyTo ? [`Reply-To: ${opts.replyTo}\r\n`] : []),
    `Subject: ${subject}\r\n`,
    `MIME-Version: 1.0\r\n`,
    `Content-Type: text/plain; charset=utf-8\r\n`,
    `\r\n`,
    body,
  ].join('')
}

export async function readLine(reader: ReadableStreamDefaultReader<Uint8Array>, buffer: { pending: string }): Promise<string> {
  // A single TextDecoder instance is reused (with { stream: true }) across
  // reads so a multi-byte UTF-8 character split across two TCP chunks is
  // reassembled correctly instead of producing replacement characters.
  const decoder = new TextDecoder()
  while (!buffer.pending.includes('\n')) {
    const { value, done } = await reader.read()
    if (done) throw new Error('SMTP connection closed unexpectedly.')
    buffer.pending += decoder.decode(value, { stream: true })
  }
  const index = buffer.pending.indexOf('\n')
  const line = buffer.pending.slice(0, index)
  buffer.pending = buffer.pending.slice(index + 1)
  return line.replace(/\r$/, '')
}

export async function readResponse(reader: ReadableStreamDefaultReader<Uint8Array>, buffer: { pending: string }): Promise<{ code: number, message: string }> {
  let line = await readLine(reader, buffer)
  // Multi-line responses use "250-..." for all but the last line, "250 ..." for the last.
  while (line[3] === '-') {
    line = await readLine(reader, buffer)
  }
  const code = Number(line.slice(0, 3))
  return { code, message: line.slice(4) }
}

export async function sendMail(
  env: { SMTP_USER?: string, SMTP_PASSWORD?: string },
  opts: { to: string, subject: string, text: string, replyTo?: string }
): Promise<void> {
  const user = env.SMTP_USER
  const password = env.SMTP_PASSWORD
  if (!user || !password) {
    throw new Error('SMTP_USER/SMTP_PASSWORD are not configured.')
  }

  const message = buildMessage({ from: user, to: opts.to, subject: opts.subject, text: opts.text, replyTo: opts.replyTo })

  const socket = connect({ hostname: SMTP_HOST, port: SMTP_PORT }, { secureTransport: 'on' })
  const writer = socket.writable.getWriter()
  const reader = socket.readable.getReader()
  const buffer = { pending: '' }
  const encoder = new TextEncoder()

  async function send(line: string) {
    await writer.write(encoder.encode(line))
  }

  async function expectCode(codePrefix: string, context: string) {
    const { code, message: msg } = await readResponse(reader, buffer)
    if (!String(code).startsWith(codePrefix)) {
      throw new Error(`SMTP error during ${context}: ${code} ${msg}`)
    }
  }

  try {
    await expectCode('220', 'greeting')

    await send(`EHLO leledanbuilds.com\r\n`)
    await expectCode('250', 'EHLO')

    await send(`AUTH LOGIN\r\n`)
    await expectCode('334', 'AUTH LOGIN prompt')

    await send(`${btoa(user)}\r\n`)
    await expectCode('334', 'username')

    await send(`${btoa(password)}\r\n`)
    await expectCode('235', 'authentication')

    await send(`MAIL FROM:<${user}>\r\n`)
    await expectCode('250', 'MAIL FROM')

    await send(`RCPT TO:<${opts.to}>\r\n`)
    await expectCode('250', 'RCPT TO')

    await send(`DATA\r\n`)
    await expectCode('354', 'DATA')

    await send(`${message}\r\n.\r\n`)
    await expectCode('250', 'message body')

    await send(`QUIT\r\n`)
  } finally {
    await writer.close().catch(() => {})
    await socket.close().catch(() => {})
  }
}
