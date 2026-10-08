// server/api/admin/upload-file/part.put.ts
//
// Uploads one part of a chunked deliverable upload. The raw part bytes are
// the request body; everything else is in the query string, so nothing has
// to be multipart-decoded.

import { requireAdmin } from '../../../utils/requireAdmin'
import { isValidDeliverableFile, extensionFromFilename } from '../../../utils/fileUpload'
import { isValidDeliverableKey, PART_SIZE_BYTES, MAX_PARTS } from '../../../utils/deliverableKey'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const bucket = event.context.cloudflare?.env?.UPLOADS
  if (!bucket) {
    throw createError({ statusCode: 503, statusMessage: 'Upload storage unavailable' })
  }

  const query = getQuery(event)
  const key = typeof query.key === 'string' ? query.key : ''
  const uploadId = typeof query.uploadId === 'string' ? query.uploadId : ''
  const partNumber = Number(query.partNumber)

  // The key comes back from the browser on every part (R2's multipart API is
  // keyed by it), so it is client-supplied here -- pin its shape rather than
  // letting a request name an arbitrary object. See the reasoning in
  // server/utils/deliverableKey.ts.
  if (!isValidDeliverableKey(key)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid upload key.' })
  }
  if (!uploadId) {
    throw createError({ statusCode: 400, statusMessage: 'uploadId is required.' })
  }
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > MAX_PARTS) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid partNumber.' })
  }

  const bytes = await readRawBody(event, false)
  if (!bytes || bytes.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Empty part body.' })
  }
  // A part larger than the agreed size would break R2's "all parts equal
  // size" rule and defeat the memory bound this whole flow exists for.
  if (bytes.length > PART_SIZE_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Part is larger than the agreed part size.' })
  }

  // Magic-byte check on the first part only -- it is the only part whose
  // bytes include the file signature. Done here rather than at `complete`
  // because rejecting now means the remaining parts are never uploaded at
  // all.
  if (partNumber === 1) {
    const extension = extensionFromFilename(key)
    if (!extension || !isValidDeliverableFile(bytes, extension)) {
      // Tear the upload down so a rejected file leaves no half-finished
      // multipart upload accruing storage.
      try {
        await bucket.resumeMultipartUpload(key, uploadId).abort()
      } catch (e) {
        console.error(`[upload-part] could not abort rejected upload ${key}:`, e)
      }
      throw createError({
        statusCode: 400,
        statusMessage: 'File contents do not match its extension (not a recognized deliverable type).',
      })
    }
  }

  const upload = bucket.resumeMultipartUpload(key, uploadId)
  let uploaded
  try {
    uploaded = await upload.uploadPart(partNumber, bytes)
  } catch (e) {
    console.error(`[upload-part] part ${partNumber} of ${key} failed:`, e)
    throw createError({ statusCode: 502, statusMessage: `Part ${partNumber} failed to upload. Please retry.` })
  }

  return { partNumber: uploaded.partNumber, etag: uploaded.etag }
})
