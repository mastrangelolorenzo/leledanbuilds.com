function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return toHex(digest)
}

export async function generateVerificationToken(): Promise<{ token: string, tokenHash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = toHex(bytes.buffer)
  const tokenHash = await hashToken(token)
  return { token, tokenHash }
}
