// server/utils/downloadFilename.test.ts
import { describe, expect, it } from 'vitest'
import { buildDownloadFilename, safeExtension, sanitizeFilename } from './downloadFilename'

describe('sanitizeFilename', () => {
  it('keeps a normal title as-is aside from hyphenating spaces', () => {
    expect(sanitizeFilename('Modern Glass Villa')).toBe('Modern-Glass-Villa')
  })

  it('collapses internal whitespace runs to a single hyphen', () => {
    expect(sanitizeFilename('Too   Many    Spaces')).toBe('Too-Many-Spaces')
  })

  it('strips characters outside the safe whitelist', () => {
    expect(sanitizeFilename('Villa: "Deluxe" Edition!')).toBe('Villa-Deluxe-Edition')
  })

  it('strips CR and LF so a crafted title cannot inject extra header lines', () => {
    const crafted = 'Evil\r\nSet-Cookie: pwned=1'
    const result = sanitizeFilename(crafted)
    expect(result).not.toMatch(/[\r\n]/)
    expect(result).toBe('EvilSet-Cookie-pwned1')
  })

  it('strips double quotes so a crafted title cannot close the filename early', () => {
    const crafted = 'x"; evil="header-injection'
    const result = sanitizeFilename(crafted)
    expect(result).not.toContain('"')
  })

  it('strips backslashes too, so an escaped quote cannot be smuggled through', () => {
    const crafted = 'x\\"injected'
    const result = sanitizeFilename(crafted)
    expect(result).not.toMatch(/["\\]/)
  })

  it('falls back to "download" when nothing survives sanitization', () => {
    expect(sanitizeFilename('!!!///???')).toBe('download')
  })

  it('falls back to "download" for a title that is only whitespace', () => {
    expect(sanitizeFilename('   ')).toBe('download')
  })

  it('falls back to "download" for a title with only non-ASCII/emoji content', () => {
    expect(sanitizeFilename('\u{1F389}\u{1F38A}\u2728')).toBe('download')
  })
})

describe('safeExtension', () => {
  it('extracts a lowercase extension from a normal deliverable key', () => {
    expect(safeExtension('deliverables/abc-123.zip')).toBe('zip')
  })

  it('lowercases a mixed-case extension', () => {
    expect(safeExtension('deliverables/abc-123.ZIP')).toBe('zip')
  })

  it('falls back to "bin" when there is no extension', () => {
    expect(safeExtension('deliverables/no-extension')).toBe('bin')
  })

  it('falls back to "bin" for an extension containing unsafe characters', () => {
    expect(safeExtension('deliverables/abc.zi"p')).toBe('bin')
  })
})

describe('buildDownloadFilename', () => {
  it('combines a sanitized title with the key extension', () => {
    expect(buildDownloadFilename('Modern Glass Villa', 'deliverables/uuid.zip')).toBe('Modern-Glass-Villa.zip')
  })

  it('still yields a usable filename when the title sanitizes to nothing', () => {
    expect(buildDownloadFilename('!!!', 'deliverables/uuid.zip')).toBe('download.zip')
  })

  it('never produces a header-breaking value even from a hostile title', () => {
    const filename = buildDownloadFilename('"\r\nX-Injected: 1\r\n', 'deliverables/uuid.zip')
    expect(filename).toBe('X-Injected-1.zip')
    expect(filename).not.toMatch(/[\r\n"]/)
  })
})
