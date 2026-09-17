import { getFeaturedPosts } from '../../utils/posts'

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  return getFeaturedPosts(db, 'home', 4)
})
