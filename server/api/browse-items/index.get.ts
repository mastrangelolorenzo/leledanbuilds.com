// server/api/browse-items/index.get.ts
import { verifySessionToken } from '../../utils/session'
import { getSessionSecret } from '../../utils/env'

interface BrowseItemRow {
  id: number
  slug: string
  title: string
  image_url: string
  price: number
  difficulty: string
  build_type: string
  theme: string
  category: string
  released: string
  description: string
  download_key: string | null
}

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  const { results } = await db
    .prepare('SELECT id, slug, title, image_url, price, difficulty, build_type, theme, category, released, description, download_key FROM browse_items ORDER BY id ASC')
    .all<BrowseItemRow>()

  let isAdmin = false
  const token = getCookie(event, 'session')
  if (token) {
    const session = await verifySessionToken(token, getSessionSecret(event))
    isAdmin = session?.role === 'admin'
  }

  return results.map(({ download_key, ...rest }) => ({
    ...rest,
    has_download: !!download_key,
    ...(isAdmin ? { download_key } : {}),
  }))
})
