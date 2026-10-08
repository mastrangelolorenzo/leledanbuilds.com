// server/api/admin/upload-file/abort.post.ts
//
// Discards an in-progress chunked upload so its parts stop costing storage.
// Called when the admin cancels, or after a part fails hard.

import { requireAdmin } from '../../../utils/requireAdmin'
import { isValidDeliverableKey } from '../../../utils/deliverableKey'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const bucket = event.context.cloudflare?.env?.UPLOADS
  if (!bucket) {
    throw createError({ statusCode: 503, statusMessage: 'Upload storage unavailable' })
  }

  const body = await readBody<{ key?: string, uploadId?: string }>(event)
  const key = typeof body?.key === 'string' ? body.key : ''
  const uploadId = typeof body?.uploadId === 'string' ? body.uploadId : ''

  if (!isValidDeliverableKey(key)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid upload key.' })
  }
  if (!uploadId) {
    throw createError({ statusCode: 400, statusMessage: 'uploadId is required.' })
  }

  try {
    await bucket.resumeMultipartUpload(key, uploadId).abort()
  } catch (e) {
    // An upload that is already gone (aborted twice, or completed) is the
    // outcome this endpoint wanted anyway -- log it and report success
    // rather than surfacing an error for a no-op cleanup.
    console.error(`[upload-abort] abort of ${key} failed (may already be gone):`, e)
  }

  return { aborted: true }
})
