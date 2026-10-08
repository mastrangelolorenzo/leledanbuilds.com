// server/utils/deliverableKey.ts
//
// The R2 object key for a paid deliverable, and the validator that keeps a
// client from choosing one.
//
// The chunked upload flow (server/api/admin/upload-file/*) has to hand the
// key back to the browser after `start` and accept it again on every
// subsequent call, because R2's multipart API is keyed by (key, uploadId).
// That makes the key client-supplied input on those later calls. Without this
// check an admin session could point `part` or `complete` at ANY key in the
// bucket -- overwriting another product's file, or writing outside
// deliverables/ where the public /uploads/ route could serve it. The routes
// are admin-only, but "only an admin can corrupt the bucket" is not the
// guarantee worth shipping when the shape is this cheap to pin down.

import { ALLOWED_DELIVERABLE_EXTENSIONS } from './fileUpload'

// Exactly what buildDeliverableKey produces: the fixed prefix, a v4-shaped
// UUID, and one allowed extension. Anchored at both ends, so no traversal
// ("../"), no nesting, no query-ish suffix can pass.
const KEY_PATTERN = new RegExp(
  `^deliverables/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${ALLOWED_DELIVERABLE_EXTENSIONS.join('|')})$`
)

export function buildDeliverableKey(extension: string): string {
  return `deliverables/${crypto.randomUUID()}.${extension}`
}

export function isValidDeliverableKey(value: unknown): boolean {
  return typeof value === 'string' && KEY_PATTERN.test(value)
}

// R2 requires every part except the last to be the same size, and at least
// 5 MiB. 10 MiB keeps the number of requests sane for a large world export
// (a 2 GB file is 205 parts) while each buffered part stays far below the
// 128 MiB isolate limit that forced the old single-shot cap of 25 MB.
export const PART_SIZE_BYTES = 10 * 1024 * 1024

// R2's own ceiling is 10,000 parts; at 10 MiB that is just under 100 GiB,
// which is far past anything this site will sell. The limit is restated here
// so `complete` can reject a malformed part list instead of passing it to R2.
export const MAX_PARTS = 10_000
