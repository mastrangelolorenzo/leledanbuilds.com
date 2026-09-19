import { describe, expect, it } from 'vitest'
import { detectImageType, extensionForType } from './imageUpload'

describe('detectImageType', () => {
  it('detects PNG from its magic bytes', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
    expect(detectImageType(png)).toBe('image/png')
  })

  it('detects JPEG from its magic bytes', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])
    expect(detectImageType(jpeg)).toBe('image/jpeg')
  })

  it('detects GIF from its magic bytes', () => {
    const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0])
    expect(detectImageType(gif)).toBe('image/gif')
  })

  it('detects WEBP from its RIFF....WEBP header', () => {
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
    expect(detectImageType(webp)).toBe('image/webp')
  })

  it('returns null for a non-image file (e.g. an HTML file spoofing an image extension)', () => {
    const html = new TextEncoder().encode('<html><script>alert(1)</script></html>')
    expect(detectImageType(html)).toBeNull()
  })

  it('returns null for an empty or too-short buffer', () => {
    expect(detectImageType(new Uint8Array([]))).toBeNull()
    expect(detectImageType(new Uint8Array([0x89, 0x50]))).toBeNull()
  })
})

describe('extensionForType', () => {
  it('maps each allowed type to its extension', () => {
    expect(extensionForType('image/webp')).toBe('webp')
    expect(extensionForType('image/png')).toBe('png')
    expect(extensionForType('image/jpeg')).toBe('jpg')
    expect(extensionForType('image/gif')).toBe('gif')
  })
})
