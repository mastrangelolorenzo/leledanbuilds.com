export default defineEventHandler(async (event) => {
  const bucket = event.context.cloudflare?.env?.UPLOADS
  if (!bucket) {
    throw createError({ statusCode: 503, statusMessage: 'Upload storage unavailable' })
  }

  const key = getRouterParam(event, 'key')
  if (!key) {
    throw createError({ statusCode: 400, statusMessage: 'Missing key.' })
  }

  const object = await bucket.get(key)
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  }

  setResponseHeader(event, 'Content-Type', object.httpMetadata?.contentType ?? 'application/octet-stream')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return object.body
})
