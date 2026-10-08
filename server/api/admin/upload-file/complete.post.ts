// server/api/admin/upload-file/complete.post.ts
//
// Finalises a chunked deliverable upload. Until this succeeds the object does
// not exist in the bucket at all, which is what makes the whole flow safe to
// abandon: a browser that closes mid-upload leaves parts, never a
// half-written file that a checkout could find and sell.

import { requireAdmin } from '../../../utils/requireAdmin'
import { isValidDeliverableKey, MAX_PARTS } from '../../../utils/deliverableKey'

interface Body {
  key?: string
  uploadId?: string
  parts?: { partNumber?: unknown, etag?: unknown }[]
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const bucket = event.context.cloudflare?.env?.UPLOADS
  if (!bucket) {
    throw createError({ statusCode: 503, statusMessage: 'Upload storage unavailable' })
  }

  const body = await readBody<Body>(event)
  const key = typeof body?.key === 'string' ? body.key : ''
  const uploadId = typeof body?.uploadId === 'string' ? body.uploadId : ''

  if (!isValidDeliverableKey(key)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid upload key.' })
  }
  if (!uploadId) {
    throw createError({ statusCode: 400, statusMessage: 'uploadId is required.' })
  }
  if (!Array.isArray(body?.parts) || body.parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'parts is required.' })
  }
  if (body.parts.length > MAX_PARTS) {
    throw createError({ statusCode: 400, statusMessage: 'Too many parts.' })
  }

  // Validate every entry before handing the list to R2: a malformed etag or
  // a non-integer part number should be a 400 here, not an opaque R2 error.
  const parts = body.parts.map((p, i) => {
    const partNumber = Number(p?.partNumber)
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > MAX_PARTS) {
      throw createError({ statusCode: 400, statusMessage: `parts[${i}].partNumber is invalid.` })
    }
    if (typeof p?.etag !== 'string' || p.etag.length === 0) {
      throw createError({ statusCode: 400, statusMessage: `parts[${i}].etag is invalid.` })
    }
    return { partNumber, etag: p.etag }
  })

  // R2 requires ascending, gapless part numbers starting at 1. Checking here
  // turns a silently-corrupt object into a clear error: a missing part would
  // otherwise assemble a file with a hole in it, which the buyer would only
  // discover when their download refused to open.
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber)
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i]!.partNumber !== i + 1) {
      throw createError({
        statusCode: 400,
        statusMessage: `Part numbers must run 1..${sorted.length} with no gaps (found ${sorted[i]!.partNumber} at position ${i + 1}).`,
      })
    }
  }

  const upload = bucket.resumeMultipartUpload(key, uploadId)
  let object
  try {
    object = await upload.complete(sorted)
  } catch (e) {
    console.error(`[upload-complete] completing ${key} failed:`, e)
    throw createError({ statusCode: 502, statusMessage: 'Could not finalise the upload. Please retry.' })
  }

  // The filename was recorded in customMetadata at `start`, so it is read
  // back from the stored object rather than trusted from this request.
  const filename = object.customMetadata?.originalFilename ?? ''

  return { key, filename, size: object.size }
})
