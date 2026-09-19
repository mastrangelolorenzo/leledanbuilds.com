import { requireAdmin } from '../../utils/requireAdmin'
import { detectImageType, extensionForType } from '../../utils/imageUpload'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

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
    throw createError({ statusCode: 400, statusMessage: 'File is too large (max 5 MB).' })
  }

  const bytes = new Uint8Array(filePart.data)
  const detectedType = detectImageType(bytes)
  if (!detectedType) {
    throw createError({ statusCode: 400, statusMessage: 'File is not a recognized image type (webp, png, jpeg, gif).' })
  }

  const key = `${crypto.randomUUID()}.${extensionForType(detectedType)}`

  await bucket.put(key, bytes, {
    httpMetadata: { contentType: detectedType },
  })

  return { url: `/uploads/${key}` }
})
