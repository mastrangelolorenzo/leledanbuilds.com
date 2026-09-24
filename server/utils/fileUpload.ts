// server/utils/fileUpload.ts
const MAGIC_BYTES: Record<string, number[]> = {
  zip: [0x50, 0x4b],
  mcworld: [0x50, 0x4b],
  rar: [0x52, 0x61, 0x72, 0x21],
  '7z': [0x37, 0x7a, 0xbc, 0xaf],
  pdf: [0x25, 0x50, 0x44, 0x46],
  schem: [0x1f, 0x8b],
  schematic: [0x1f, 0x8b],
  litematic: [0x1f, 0x8b],
}

export const ALLOWED_DELIVERABLE_EXTENSIONS = ['zip', 'rar', '7z', 'schem', 'schematic', 'litematic', 'mcworld', 'pdf'] as const

export function extensionFromFilename(filename: string): string | null {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename)
  return match ? match[1]!.toLowerCase() : null
}

export function isValidDeliverableFile(bytes: Uint8Array, extension: string): boolean {
  if (!(ALLOWED_DELIVERABLE_EXTENSIONS as readonly string[]).includes(extension)) {
    return false
  }
  const signature = MAGIC_BYTES[extension]
  if (!signature) return true
  if (bytes.length < signature.length) return false
  return signature.every((byte, i) => bytes[i] === byte)
}
