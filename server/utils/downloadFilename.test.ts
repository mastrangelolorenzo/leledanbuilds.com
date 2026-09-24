// server/utils/downloadFilename.test.ts
import { describe, expect, it } from 'vitest'
import { buildContentDisposition, buildDownloadFilename, encodeRfc5987ValueChars, safeExtension, sanitizeFilename } from './downloadFilename'

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
    // Pinned to the exact output (verified by running sanitizeFilename, not
    // copied from the review) rather than asserting only the absence of '"'
    // -- a stub that always returns e.g. a constant "safe" string would
    // still pass a not.toContain('"') check without doing any real work.
    expect(result).toBe('x-evilheader-injection')
    expect(result).not.toContain('"')
  })

  it('strips backslashes too, so an escaped quote cannot be smuggled through', () => {
    const crafted = 'x\\"injected'
    const result = sanitizeFilename(crafted)
    // Same reasoning as above: pin the exact string, not just a negative.
    expect(result).toBe('xinjected')
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

// Every character encodeRfc5987ValueChars can ever emit unescaped, plus the
// exact set of extra characters it escapes beyond what encodeURIComponent
// does on its own. Kept as one regex so both this file's own assertions and
// buildContentDisposition's filename* output can be checked against the
// same definition of "safe".
const RFC5987_SAFE_OUTPUT = /^(?:[A-Za-z0-9!#$&+\-.^_`|~]|%[0-9A-F]{2})*$/

describe('encodeRfc5987ValueChars', () => {
  it('leaves plain ASCII alone', () => {
    expect(encodeRfc5987ValueChars('simple-title_2')).toBe('simple-title_2')
  })

  it('percent-encodes accented text as UTF-8 bytes', () => {
    expect(encodeRfc5987ValueChars('Café')).toBe('Caf%C3%A9')
  })

  it('escapes every character encodeURIComponent would otherwise leave literal but RFC 5987 does not allow', () => {
    // '!', "'", '(', ')', '*' are exactly the characters encodeURIComponent
    // does not touch on its own (beyond alnum/-/_/.~) -- confirms all five
    // are escaped, not just the four that are strictly required to be.
    expect(encodeRfc5987ValueChars(`!'()*`)).toBe('%21%27%28%29%2A')
  })

  it('strips CR and LF before encoding, independent of encodeURIComponent', () => {
    // encodeURIComponent would itself percent-encode a raw CR/LF -- this
    // proves the newline is gone even earlier than that, by removal, so the
    // "no raw newline reaches the header" guarantee never depends on
    // encodeURIComponent's own correctness.
    expect(encodeRfc5987ValueChars('a\r\nb')).toBe('ab')
  })

  it('produces only the allowed RFC 5987 attr-chars and %XX escapes across a hostile sweep', () => {
    const hostile = 'Evil"\r\n;\\`~^|#$&+.-_!\'()*<>{}[]=,:\tCafe with accents: e-acute e-grave a-circumflex n-tilde, plus emoji and CJK: fireworks sparkles nihongo'
    const encoded = encodeRfc5987ValueChars(hostile)
    expect(encoded).toMatch(RFC5987_SAFE_OUTPUT)
    // And, just as importantly, it round-trips back to the original text
    // (minus the CR/LF this function deliberately drops) rather than
    // mangling it -- this isn't a lossy ASCII-only whitelist like
    // sanitizeFilename.
    expect(decodeURIComponent(encoded)).toBe(hostile.replace(/[\r\n]/g, ''))
  })

  it('produces only the allowed RFC 5987 attr-chars and %XX escapes for real accented and emoji text', () => {
    const hostile = 'Café d\u2019Élite "quoted"; semi\r\ncolon \u{1F389}\u{1F38A} \u65E5\u672C\u8A9E'
    const encoded = encodeRfc5987ValueChars(hostile)
    expect(encoded).toMatch(RFC5987_SAFE_OUTPUT)
    expect(decodeURIComponent(encoded)).toBe(hostile.replace(/[\r\n]/g, ''))
  })
})

describe('buildContentDisposition', () => {
  it('emits only filename= for a plain ASCII title (no redundant filename*)', () => {
    const value = buildContentDisposition('Modern Glass Villa', 'deliverables/uuid.zip')
    expect(value).toBe('filename="Modern-Glass-Villa.zip"')
    expect(value).not.toContain('filename*')
  })

  it('adds a correct filename* for an accented title, preserving the real title', () => {
    const value = buildContentDisposition("Villa d'Élite", 'deliverables/uuid.zip')
    expect(value).toBe(`filename="Villa-dlite.zip"; filename*=UTF-8''Villa%20d%27%C3%89lite.zip`)

    const encodedPart = /filename\*=UTF-8''(.+)\.zip$/.exec(value)?.[1]
    expect(encodedPart).toBeTruthy()
    expect(decodeURIComponent(encodedPart!)).toBe("Villa d'Élite")
  })

  it('lets nothing dangerous survive into either parameter for a hostile accented title', () => {
    const value = buildContentDisposition('Café"; evil\r\ninjected', 'deliverables/uuid.zip')
    expect(value).toBe(`filename="Caf-evilinjected.zip"; filename*=UTF-8''Caf%C3%A9%22%3B%20evilinjected.zip`)

    // No raw CR or LF anywhere in the full header value -- not just in the
    // ASCII filename=, but in the RFC 5987 filename* companion too.
    expect(value).not.toMatch(/[\r\n]/)
    // Exactly the two structural quotes that legitimately delimit
    // filename="..." -- proves the crafted title's own '"' did not survive
    // as a third, attacker-controlled quote anywhere (filename* itself is
    // an unquoted, fully percent-encoded token per RFC 5987, so it
    // contributes none).
    expect(value.match(/"/g)?.length).toBe(2)
    // Only one parameter separator (the ; between filename= and filename*)
    // -- confirms the crafted title's own ';' did not survive as a second,
    // attacker-controlled parameter boundary.
    expect(value.split(';').length).toBe(2)

    const encodedPart = /filename\*=UTF-8''(.+)\.zip$/.exec(value)?.[1]
    expect(encodedPart).toBeTruthy()
    expect(encodedPart!).toMatch(RFC5987_SAFE_OUTPUT)
  })

  it('keeps the "download" fallback on both parameters for an all-non-ASCII title', () => {
    const value = buildContentDisposition('\u65E5\u672C\u8A9E\u306E\u30BF\u30A4\u30C8\u30EB', 'deliverables/uuid.zip')
    expect(value).toBe('filename="download.zip"')
    expect(value).not.toContain('filename*')
  })
})
