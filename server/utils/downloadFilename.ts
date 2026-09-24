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
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-') || 'download'
}

// download_key is written only by our own upload code
// (server/api/admin/upload-file.post.ts), which always appends one of a
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
