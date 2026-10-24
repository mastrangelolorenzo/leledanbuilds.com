// server/api/browse-items/index.get.ts
import { verifySessionToken } from '../../utils/session'
import { getSessionSecret } from '../../utils/env'
import { ratingAverage } from '../../utils/rating'

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
  section: string
  download_key: string | null
}

interface LikeCountRow {
  browse_item_id: number
  count: number
}

interface LikedRow {
  browse_item_id: number
}

interface RatingRow {
  browse_item_id: number
  count: number
  total: number
}

interface MyRatingRow {
  browse_item_id: number
  rating: number
}

export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
  const { results } = await db
    .prepare('SELECT id, slug, title, image_url, price, difficulty, build_type, theme, category, released, description, section, download_key FROM browse_items ORDER BY id ASC')
    .all<BrowseItemRow>()

  // Soft session check: an absent/invalid cookie must still return the
  // public shape below (never a 401) -- this same check already gates
  // download_key to admins only, and is now reused (not duplicated) to also
  // gate liked_by_me to the requester's own state. See the load-bearing
  // comment on that field below.
  let isAdmin = false
  let userId: number | null = null
  const token = getCookie(event, 'session')
  if (token) {
    const session = await verifySessionToken(token, getSessionSecret(event))
    isAdmin = session?.role === 'admin'
    userId = session?.userId ?? null
  }

  // One aggregate query for every item's public like count -- never one
  // query per item. This is the only thing about likes that is visible to
  // everyone, including anonymous visitors.
  const { results: likeCounts } = await db
    .prepare('SELECT browse_item_id, COUNT(*) as count FROM browse_item_likes GROUP BY browse_item_id')
    .all<LikeCountRow>()
  const countsById = new Map(likeCounts.map((row) => [row.browse_item_id, row.count]))

  // A second aggregate query, scoped to the caller's own userId, run only
  // when a valid session is present. This must never select or expose
  // *who else* liked an item -- only which of the current items this one
  // caller has liked themselves.
  let likedById: Set<number> | null = null
  if (userId !== null) {
    const { results: liked } = await db
      .prepare('SELECT browse_item_id FROM browse_item_likes WHERE user_id = ?')
      .bind(userId)
      .all<LikedRow>()
    likedById = new Set(liked.map((row) => row.browse_item_id))
  }

  // Skinpacks show a 1-5 star rating instead of the like button. One
  // aggregate for everyone's scores, mirroring the like counts above --
  // never a query per item.
  const { results: ratings } = await db
    .prepare('SELECT browse_item_id, COUNT(*) as count, SUM(rating) as total FROM browse_item_ratings GROUP BY browse_item_id')
    .all<RatingRow>()
  const ratingsById = new Map(ratings.map((row) => [row.browse_item_id, row]))

  // And the caller's own scores, only when signed in -- same rule as
  // liked_by_me: never expose who else rated what, only this caller's.
  let myRatingById: Map<number, number> | null = null
  if (userId !== null) {
    const { results: mine } = await db
      .prepare('SELECT browse_item_id, rating FROM browse_item_ratings WHERE user_id = ?')
      .bind(userId)
      .all<MyRatingRow>()
    myRatingById = new Map(mine.map((row) => [row.browse_item_id, row.rating]))
  }

  return results.map(({ download_key, ...rest }) => ({
    ...rest,
    has_download: !!download_key,
    like_count: countsById.get(rest.id) ?? 0,
    rating_count: ratingsById.get(rest.id)?.count ?? 0,
    rating_avg: ratingAverage(ratingsById.get(rest.id)?.total ?? 0, ratingsById.get(rest.id)?.count ?? 0),
    ...(myRatingById ? { my_rating: myRatingById.get(rest.id) ?? 0 } : {}),
    ...(likedById ? { liked_by_me: likedById.has(rest.id) } : {}),
    ...(isAdmin ? { download_key } : {}),
  }))
})
