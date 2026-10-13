// server/api/admin/hero-backgrounds/index.post.ts
//
// Adds an image to the home hero rotation. The file itself is uploaded
// through /api/admin/upload first; this stores the URL that returned.

import { requireAdmin } from '../../../utils/requireAdmin'

// Only a path on this site. An absolute URL would let the home page's
// backgrounds be pointed at a third-party host, which would leak every
// visitor to it and break the page if it went away.
const ALLOWED = /^\/(uploads|background|portfolio|images)\/[A-Za-z0-9._-]+$/

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ image_url?: unknown }>(event)
  const imageUrl = typeof body?.image_url === 'string' ? body.image_url.trim() : ''

  if (!ALLOWED.test(imageUrl)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'image_url must be an uploaded path on this site.',
    })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const existing = await db
    .prepare('SELECT id FROM hero_backgrounds WHERE image_url = ?')
    .bind(imageUrl)
    .first<{ id: number }>()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'That image is already in the rotation.' })
  }

  // Appended at the end rather than inserted at 0, so adding an image never
  // silently reshuffles the order the operator already arranged.
  const max = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS n FROM hero_backgrounds')
    .first<{ n: number }>()

  const result = await db
    .prepare('INSERT INTO hero_backgrounds (image_url, sort_order) VALUES (?, ?)')
    .bind(imageUrl, (max?.n ?? -1) + 1)
    .run()

  return { id: result.meta?.last_row_id, image_url: imageUrl }
})
