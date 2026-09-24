import { requireAdmin } from '../../utils/requireAdmin'
import { extensionFromFilename, isValidDeliverableFile } from '../../utils/fileUpload'

// 100 MB advertised previously, but readMultipartFormData buffers the whole
// body and then got copied a second time into a new Uint8Array below --
// peak memory roughly 3x the file against a 128 MB Workers isolate limit,
// so a 100 MB upload died during buffering, before this check ever ran.
// 25 MB is a cap that can actually complete on the real runtime.
const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const bucket = event.context.cloudflare?.env?.UPLOADS
  if (!bucket) {
    throw createError({ statusCode: 503, statusMessage: 'Upload storage unavailable' })
  }

  const form = await readMultipartFormData(event)
  const filePart = form?.find(p => p.name === 'file')

  if (!filePart || !filePart.data || filePart.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided.' })
  }
  if (filePart.data.length > MAX_SIZE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'File is too large (max 25 MB).' })
  }

  const filename = filePart.filename ?? ''
  const extension = extensionFromFilename(filename)
  if (!extension) {
    throw createError({ statusCode: 400, statusMessage: 'File must have a recognized extension.' })
  }

  // filePart.data is already a Buffer, which IS a Uint8Array (h3's
  // MultiPartData types it as Buffer) -- pass it straight through instead
  // of copying it again into a second same-size buffer.
  if (!isValidDeliverableFile(filePart.data, extension)) {
    throw createError({ statusCode: 400, statusMessage: 'File is not a recognized deliverable type (zip, rar, 7z, schem, schematic, litematic, mcworld, pdf).' })
  }

  const key = `deliverables/${crypto.randomUUID()}.${extension}`

  await bucket.put(key, filePart.data, {
    httpMetadata: { contentType: 'application/octet-stream' },
    customMetadata: { originalFilename: filename },
  })

  return { key, filename }
})
