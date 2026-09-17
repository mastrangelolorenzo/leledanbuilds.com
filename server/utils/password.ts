const ITERATIONS = 100_000

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

async function deriveHash(password: string, saltBytes: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return toHex(bits)
}

export async function hashPassword(password: string): Promise<{ hash: string, salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = toHex(saltBytes.buffer)
  const hash = await deriveHash(password, saltBytes)
  return { hash, salt }
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const candidate = await deriveHash(password, fromHex(salt))
  return candidate === hash
}
