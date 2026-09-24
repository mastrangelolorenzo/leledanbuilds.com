// server/utils/fileUpload.test.ts
import { describe, expect, it } from 'vitest'
import { extensionFromFilename, isValidDeliverableFile } from './fileUpload'

describe('extensionFromFilename', () => {
  it('extracts a lowercase extension', () => {
    expect(extensionFromFilename('MyWorld.ZIP')).toBe('zip')
  })

  it('returns null when there is no extension', () => {
    expect(extensionFromFilename('noextension')).toBeNull()
  })
})

describe('isValidDeliverableFile', () => {
  it('accepts a real zip signature with a zip extension', () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0])
    expect(isValidDeliverableFile(bytes, 'zip')).toBe(true)
  })

  it('accepts a real gzip signature with a schem extension', () => {
    const bytes = new Uint8Array([0x1f, 0x8b, 0x08, 0, 0, 0])
    expect(isValidDeliverableFile(bytes, 'schem')).toBe(true)
  })

  it('rejects a disallowed extension', () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04])
    expect(isValidDeliverableFile(bytes, 'exe')).toBe(false)
  })

  it('rejects a zip extension whose bytes are not actually a zip', () => {
    const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x00])
    expect(isValidDeliverableFile(bytes, 'zip')).toBe(false)
  })

  it('rejects a file shorter than the expected signature', () => {
    const bytes = new Uint8Array([0x50])
    expect(isValidDeliverableFile(bytes, 'zip')).toBe(false)
  })

  it('accepts a pdf whose extension has no case-sensitivity issues', () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])
    expect(isValidDeliverableFile(bytes, 'pdf')).toBe(true)
  })
})
