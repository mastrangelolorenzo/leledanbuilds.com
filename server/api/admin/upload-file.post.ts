import { requireAdmin } from '../../utils/requireAdmin'
import { extensionFromFilename, isValidDeliverableFile } from '../../utils/fileUpload'

const MAX_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB

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
    throw createError({ statusCode: 400, statusMessage: 'File is too large (max 100 MB).' })
  }

  const filename = filePart.filename ?? ''
  const extension = extensionFromFilename(filename)
  if (!extension) {
    throw createError({ statusCode: 400, statusMessage: 'File must have a recognized extension.' })
  }

  const bytes = new Uint8Array(filePart.data)
  if (!isValidDeliverableFile(bytes, extension)) {
    throw createError({ statusCode: 400, statusMessage: 'File is not a recognized deliverable type (zip, rar, 7z, schem, schematic, litematic, mcworld, pdf).' })
  }

  const key = `deliverables/${crypto.randomUUID()}.${extension}`

  await bucket.put(key, bytes, {
    httpMetadata: { contentType: 'application/octet-stream' },
    customMetadata: { originalFilename: filename },
  })

  return { key, filename }
})
