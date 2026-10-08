// server/api/admin/upload-file/start.post.ts
//
// Opens an R2 multipart upload for a deliverable.
//
// Why chunked at all: this replaced a single-request endpoint that read the
// whole body with readMultipartFormData, which buffers it in a 128 MiB
// isolate and so capped out around 25 MB -- far too small for a real
// Minecraft world export. Here the browser slices the file and each request
// carries one part, so peak memory per request is one part regardless of
// total file size.

import { requireAdmin } from '../../../utils/requireAdmin'
import { extensionFromFilename, ALLOWED_DELIVERABLE_EXTENSIONS } from '../../../utils/fileUpload'
import { buildDeliverableKey, PART_SIZE_BYTES } from '../../../utils/deliverableKey'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const bucket = event.context.cloudflare?.env?.UPLOADS
  if (!bucket) {
    throw createError({ statusCode: 503, statusMessage: 'Upload storage unavailable' })
  }

  const body = await readBody<{ filename?: string }>(event)
  const filename = typeof body?.filename === 'string' ? body.filename : ''
  const extension = extensionFromFilename(filename)

  if (!extension) {
    throw createError({ statusCode: 400, statusMessage: 'File must have a recognized extension.' })
  }
  if (!(ALLOWED_DELIVERABLE_EXTENSIONS as readonly string[]).includes(extension)) {
    throw createError({
      statusCode: 400,
      statusMessage: `File must be one of: ${ALLOWED_DELIVERABLE_EXTENSIONS.join(', ')}.`,
    })
  }

  const key = buildDeliverableKey(extension)

  // The original filename is recorded now so `complete` does not have to
  // trust a second client-supplied copy of it. It only reaches the buyer
  // through server/utils/downloadFilename.ts, which sanitises it.
  const upload = await bucket.createMultipartUpload(key, {
    httpMetadata: { contentType: 'application/octet-stream' },
    customMetadata: { originalFilename: filename },
  })

  return { key, uploadId: upload.uploadId, partSize: PART_SIZE_BYTES }
})
