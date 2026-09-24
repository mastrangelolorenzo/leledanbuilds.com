// server/api/downloads/[browseItemId].get.ts
//
// The only path to a paid file. `server/routes/uploads/[key].get.ts` (the
// public R2 proxy) refuses any key that decodes to contain a '/', and every
// deliverable key lives under the `deliverables/` prefix -- so this ownership
// check is the single thing standing between a paid product and the public.
import { requireAuth } from '../../utils/requireAuth'
import { buildContentDisposition } from '../../utils/downloadFilename'

interface OrderRow {
  id: number
}

interface ItemRow {
  title: string
  download_key: string | null
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const browseItemId = Number(getRouterParam(event, 'browseItemId'))
  if (!Number.isInteger(browseItemId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid item id.' })
  }

  const db = event.context.cloudflare?.env?.DB
  const bucket = event.context.cloudflare?.env?.UPLOADS
  if (!db || !bucket) {
    throw createError({ statusCode: 503, statusMessage: 'Service unavailable' })
  }

  // Ownership is scoped to session.userId, which comes from the verified
  // session cookie (requireAuth/verifySessionToken) -- never from anything
  // the client sends. browseItemId is just a public catalog id, not a
  // capability, so using it from the URL is fine as long as it's always
  // paired with the server-derived userId in this same WHERE clause. Only a
  // 'completed' order (real settlement/capture evidence, per Stripe's and
  // PayPal's webhook handlers) grants access -- 'pending' and 'failed' both
  // fall through to the 403 below.
  const order = await db
    .prepare(`SELECT id FROM orders WHERE user_id = ? AND browse_item_id = ? AND status = 'completed' LIMIT 1`)
    .bind(session.userId, browseItemId)
    .first<OrderRow>()

  if (!order) {
    throw createError({ statusCode: 403, statusMessage: 'You have not purchased this item.' })
  }

  const item = await db
    .prepare('SELECT title, download_key FROM browse_items WHERE id = ?')
    .bind(browseItemId)
    .first<ItemRow>()

  if (!item?.download_key) {
    throw createError({ statusCode: 404, statusMessage: 'No file is attached to this item.' })
  }

  const object = await bucket.get(item.download_key)
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'File not found in storage.' })
  }

  setResponseHeader(event, 'Content-Type', 'application/octet-stream')
  setResponseHeader(event, 'Content-Disposition', `attachment; ${buildContentDisposition(item.title, item.download_key)}`)
  // Paid content: must never be served out of a shared/proxy cache to
  // anyone but the owner who was just re-checked above.
  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  return object.body
})
