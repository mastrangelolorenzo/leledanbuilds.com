import { getFeaturedPosts } from '../../utils/posts'

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  // No limit: /portfolio is the full gallery. The home page keeps its cap of
  // 4 because its layout is a fixed four-up row.
  return getFeaturedPosts(db, 'portfolio')
})
