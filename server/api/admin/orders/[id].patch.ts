// server/api/admin/orders/[id].patch.ts
//
// The two things an operator needs to record against an order by hand: a
// note, and "I have refunded this in the Stripe dashboard".
//
// Deliberately NOT able to change status. Completing an order is the one
// decision that must come from the provider, never from a dashboard click --
// see the reasoning in ./[id]/reconcile.post.ts.

import { requireAdmin } from '../../../utils/requireAdmin'

const MAX_NOTE_LENGTH = 500

interface Body {
  admin_note?: string | null
  // true  -> record that the refund has been issued
  // false -> undo that (it was recorded by mistake)
  refunded?: boolean
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order id.' })
  }

  const body = await readBody<Body>(event)
  if (!body || (body.admin_note === undefined && body.refunded === undefined)) {
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update.' })
  }

  let note: string | null | undefined
  if (body.admin_note !== undefined) {
    if (body.admin_note === null) {
      note = null
    } else if (typeof body.admin_note !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'admin_note must be a string or null.' })
    } else {
      const trimmed = body.admin_note.trim()
      if (trimmed.length > MAX_NOTE_LENGTH) {
        throw createError({ statusCode: 400, statusMessage: `admin_note must be ${MAX_NOTE_LENGTH} characters or fewer.` })
      }
      // An empty string clears the note rather than storing "".
      note = trimmed.length > 0 ? trimmed : null
    }
  }

  if (body.refunded !== undefined && typeof body.refunded !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'refunded must be a boolean.' })
  }

  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }

  const now = new Date().toISOString()

  // CASE-guarded single statement rather than building SQL from whichever
  // fields are present: a field the caller omitted keeps its stored value,
  // so a PATCH carrying only a note cannot wipe refunded_at (the same bug
  // that once silently wiped browse_items.download_key -- see the PUT in
  // server/api/admin/browse-items/[id].put.ts).
  const result = await db
    .prepare(`
      UPDATE orders SET
        admin_note = CASE WHEN ?1 THEN ?2 ELSE admin_note END,
        refunded_at = CASE
          WHEN ?3 = 0 THEN refunded_at
          WHEN ?4 = 1 THEN COALESCE(refunded_at, ?5)
          ELSE NULL
        END,
        -- Recording a refund settles the "money is owed back" flag; undoing
        -- the recording puts it back, because the duplicate is still a
        -- duplicate.
        needs_refund = CASE
          WHEN ?3 = 0 THEN needs_refund
          WHEN ?4 = 1 THEN 0
          ELSE needs_refund
        END,
        updated_at = ?5
      WHERE id = ?6
    `)
    .bind(
      note !== undefined ? 1 : 0,
      note ?? null,
      body.refunded !== undefined ? 1 : 0,
      body.refunded === true ? 1 : 0,
      now,
      id
    )
    .run()

  if (!result.meta?.changes) {
    // Either the order does not exist, or the PATCH was a no-op that changed
    // nothing. Distinguish them so a 404 means what it says.
    const exists = await db.prepare('SELECT id FROM orders WHERE id = ?').bind(id).first<{ id: number }>()
    if (!exists) {
      throw createError({ statusCode: 404, statusMessage: 'Order not found.' })
    }
  }

  const updated = await db
    .prepare('SELECT id, admin_note, refunded_at, needs_refund FROM orders WHERE id = ?')
    .bind(id)
    .first<{ id: number, admin_note: string | null, refunded_at: string | null, needs_refund: number }>()

  return { ...updated, needs_refund: updated?.needs_refund === 1 }
})
