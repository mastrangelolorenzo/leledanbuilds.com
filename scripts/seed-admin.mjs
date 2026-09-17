import { execSync } from 'node:child_process'
import { webcrypto } from 'node:crypto'

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars before running this script.')
  process.exit(1)
}

const salt = Buffer.from(webcrypto.getRandomValues(new Uint8Array(16))).toString('hex')

async function hash(password, saltHex) {
  const saltBytes = Uint8Array.from(Buffer.from(saltHex, 'hex'))
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return Buffer.from(bits).toString('hex')
}

const passwordHash = await hash(password, salt)

const sql = `INSERT INTO users (email, password_hash, salt, role) VALUES ('${email.replace(/'/g, "''")}', '${passwordHash}', '${salt}', 'admin');`

execSync(`npx wrangler d1 execute leledan-builds --local --command "${sql}"`, { stdio: 'inherit' })
console.log(`Admin user ${email} seeded locally.`)
