// server/utils/downloadFilename.ts
//
// Builds the filename used in the gated download's `Content-Disposition`
// header (server/api/downloads/[browseItemId].get.ts). The title comes from
// an admin-controlled column (browse_items.title), so it is never directly
// attacker-controlled -- but this still sanitizes defensively, because a
// header-injection bug here would be the kind of thing that only bites once
// something upstream (an import script, a future public-facing edit form,
// a compromised admin session) stops being trustworthy.

// Whitelist-based: keeps letters, digits, '-', '_' and space, and drops
// everything else. That ropes in CR, LF, '"' and '\' -- the characters that
// would otherwise let a crafted title break out of the quoted filename or
// inject extra header lines -- so none of them can ever reach the header
// value. `|| 'download'` covers a title that sanitizes to nothing (e.g. one
// made entirely of emoji or punctuation) so the result is always non-empty.
//
// Shared with buildContentDisposition below, which needs to know whether
// sanitization emptied the title out *before* the 'download' fallback is
// applied (see its "sanitizes to nothing" branch).
function sanitizedCore(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-')
}

export function sanitizeFilename(name: string): string {
  return sanitizedCore(name) || 'download'
}

// download_key is written only by our own upload code
// (server/utils/deliverableKey.ts), which always appends one of a
// fixed set of lowercase alphanumeric extensions -- but the admin
// browse-items create/update endpoints accept download_key as a raw string
// with no format check, so this still parses the suffix defensively rather
// than trusting whatever follows the last dot to be header-safe on its own.
// Anything that isn't a short run of plain alphanumerics falls back to a
// safe default extension instead of reaching the header unfiltered.
export function safeExtension(downloadKey: string): string {
  const match = /\.([a-zA-Z0-9]{1,10})$/.exec(downloadKey)
  return match ? match[1]!.toLowerCase() : 'bin'
}

export function buildDownloadFilename(title: string, downloadKey: string): string {
  return `${sanitizeFilename(title)}.${safeExtension(downloadKey)}`
}

// RFC 5987 attr-char is ALPHA / DIGIT / "!" / "#" / "$" / "&" / "+" / "-" /
// "." / "^" / "_" / "`" / "|" / "~" -- everything else in the value must be
// pct-encoded. encodeURIComponent already pct-encodes everything unsafe
// (including CR/LF, '"', ';', control characters, and all non-ASCII text as
// UTF-8 bytes) EXCEPT for six characters it deliberately leaves literal:
// '!', '~', '*', "'", '(', ')'. Of those, '*' is reserved by RFC 5987's own
// syntax (it's what marks an extended-value parameter) and "'" / '(' / ')'
// are HTTP token separators excluded from attr-char -- so all five of
// "!'()* " are escaped again here, even though '!' and '~' would strictly
// be legal literal attr-chars on their own; being stricter than the minimum
// here costs nothing and keeps the allowed-output charset easy to state and
// test in one place.
//
// CR/LF are stripped before encodeURIComponent ever sees them -- not
// because encodeURIComponent would leave them literal (it doesn't; it
// pct-encodes them like any other control character), but so the guarantee
// "no raw newline reaches the header" doesn't depend on trusting the
// encoder's behaviour at all. Belt-and-suspenders, not a workaround for a
// known gap.
export function encodeRfc5987ValueChars(value: string): string {
  const noNewlines = value.replace(/[\r\n]/g, '')
  return encodeURIComponent(noNewlines).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

function isAsciiOnly(value: string): boolean {
  return /^[\x00-\x7F]*$/.test(value)
}

// Builds the full `Content-Disposition` value (everything after
// `attachment; `): the existing ASCII-only `filename=` parameter, plus an
// RFC 5987 `filename*` companion when there's a real, accented/non-ASCII
// title worth preserving for browsers that support it. `filename=` is
// always present and always exactly what buildDownloadFilename already
// produced (untouched fallback behaviour for every existing caller).
//
// filename* is omitted in two cases:
//  - the title has no non-ASCII characters at all, so filename* would just
//    duplicate filename= with no benefit;
//  - the title sanitizes to nothing (sanitizedCore is empty), meaning
//    filename= itself is already the 'download' fallback -- both parameters
//    should show that same fallback rather than filename* encoding some
//    unrelated string (emoji, pure punctuation, etc.) the ASCII side had to
//    discard entirely.
export function buildContentDisposition(title: string, downloadKey: string): string {
  const asciiFilename = buildDownloadFilename(title, downloadKey)
  const base = `filename="${asciiFilename}"`

  if (sanitizedCore(title) === '') {
    return base
  }

  const cleanedTitle = title.replace(/[\r\n]/g, '').trim()
  if (isAsciiOnly(cleanedTitle)) {
    return base
  }

  const encodedName = `${encodeRfc5987ValueChars(cleanedTitle)}.${safeExtension(downloadKey)}`
  return `${base}; filename*=UTF-8''${encodedName}`
}
