type AllowedImageType = 'image/webp' | 'image/png' | 'image/jpeg' | 'image/gif'

export function detectImageType(bytes: Uint8Array): AllowedImageType | null {
  // Shortest signature we check (JPEG/PNG/GIF) needs at least 4 bytes;
  // WEBP is checked separately below since it needs 12.
  if (bytes.length < 4) return null

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  // GIF: "GIF87a" or "GIF89a"
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif'
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp'
  }

  return null
}

export function extensionForType(type: string): string {
  switch (type) {
    case 'image/webp': return 'webp'
    case 'image/png': return 'png'
    case 'image/jpeg': return 'jpg'
    case 'image/gif': return 'gif'
    default: return 'bin'
  }
}
