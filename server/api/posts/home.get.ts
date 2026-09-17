import { getFeaturedPosts } from '../../utils/posts'

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare.env.DB
  return getFeaturedPosts(db, 'home', 4)
})
