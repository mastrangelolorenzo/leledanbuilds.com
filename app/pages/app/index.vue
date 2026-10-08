<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
      <p class="text-text/50 text-sm mt-1">Welcome back{{ user?.role === 'admin' ? ', admin' : '' }}.</p>
    </div>

    <template v-if="user?.role === 'admin'">
      <p v-if="statsError" class="text-red-400 text-sm mb-4">{{ statsError }}</p>

      <!-- Anything needing a human comes first, and only when non-zero, so a
           healthy dashboard stays quiet instead of showing a row of zeroes. -->
      <NuxtLink
        v-if="attentionCount > 0"
        to="/app/orders"
        class="flex items-center gap-3 bg-red-500/10 border border-red-500/40 rounded-2xl px-5 py-4 mb-6 hover:bg-red-500/15 transition-colors"
      >
        <UIcon name="i-lucide-alert-triangle" class="text-xl text-red-400 shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="text-red-400 font-bold text-sm">{{ attentionCount }} order(s) need attention</p>
          <p class="text-text/50 text-xs">{{ attentionDetail }}</p>
        </div>
        <UIcon name="i-lucide-arrow-right" class="text-sm text-red-400/70 shrink-0" />
      </NuxtLink>

      <!-- People -->
      <h2 class="text-sm font-bold uppercase tracking-wide text-text/70 mb-3">People</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Registered</p>
          <p class="text-3xl font-bold text-text">{{ stats?.users.total ?? 0 }}</p>
          <p class="text-text/40 text-xs mt-1">
            +{{ stats?.users.new_this_week ?? 0 }} this week
          </p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Verified</p>
          <p class="text-3xl font-bold text-primary">{{ stats?.users.verified ?? 0 }}</p>
          <p class="text-text/40 text-xs mt-1">{{ stats?.users.unverified ?? 0 }} unverified</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Customers</p>
          <p class="text-3xl font-bold text-primary">{{ stats?.users.customers ?? 0 }}</p>
          <p class="text-text/40 text-xs mt-1">{{ stats?.sales.conversion_percent ?? 0 }}% of signups</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">New / 30 days</p>
          <p class="text-3xl font-bold text-text">{{ stats?.users.new_this_month ?? 0 }}</p>
          <p class="text-text/40 text-xs mt-1">{{ stats?.users.admins ?? 0 }} admin(s)</p>
        </div>
      </div>

      <!-- Signups over the last week. A plain bar row rather than a chart
           library: seven numbers do not justify a dependency, and the shape
           is all the owner needs to read at a glance. -->
      <div v-if="signupTrend.length" class="bg-background-secondary border border-white/10 rounded-2xl p-5 mb-8">
        <h2 class="text-sm font-bold uppercase tracking-wide text-text/70 mb-4">Signups, last 7 days</h2>
        <div class="flex items-end gap-2 h-24">
          <div v-for="d in signupTrend" :key="d.day" class="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <span class="text-text/60 text-xs font-bold">{{ d.n }}</span>
            <div
              class="w-full rounded-t"
              :class="d.n > 0 ? 'bg-primary/60' : 'bg-white/10'"
              :style="{ height: `${barHeightPercent(d.n)}%` }"
            ></div>
            <span class="text-text/30 text-[10px] truncate w-full text-center">{{ d.label }}</span>
          </div>
        </div>
      </div>

      <!-- Sales -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold uppercase tracking-wide text-text/70">Sales</h2>
        <NuxtLink to="/app/orders" class="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-primary hover:text-secondary transition-colors">
          All orders
          <UIcon name="i-lucide-arrow-right" class="text-xs" />
        </NuxtLink>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Revenue</p>
          <p class="text-3xl font-bold text-primary">€{{ stats?.sales.revenue ?? 0 }}</p>
          <p class="text-text/40 text-xs mt-1">€{{ stats?.sales.revenue_this_month ?? 0 }} last 30 days</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Sales</p>
          <p class="text-3xl font-bold text-text">{{ stats?.sales.count ?? 0 }}</p>
          <p class="text-text/40 text-xs mt-1">{{ stats?.sales.count_this_month ?? 0 }} last 30 days</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Pending</p>
          <p class="text-3xl font-bold" :class="(stats?.sales.pending ?? 0) > 0 ? 'text-amber-400' : 'text-text'">
            {{ stats?.sales.pending ?? 0 }}
          </p>
          <p class="text-text/40 text-xs mt-1">Awaiting settlement</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Avg. order</p>
          <p class="text-3xl font-bold text-text">€{{ averageOrder }}</p>
          <p class="text-text/40 text-xs mt-1">Per completed sale</p>
        </div>
      </div>

      <!-- Content -->
      <h2 class="text-sm font-bold uppercase tracking-wide text-text/70 mb-3">Content</h2>
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Builds</p>
          <p class="text-2xl font-bold text-text">{{ stats?.content.browse_items ?? 0 }}</p>
          <p class="text-text/40 text-xs mt-1">{{ stats?.content.browse_items_sellable ?? 0 }} sellable</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Posts</p>
          <p class="text-2xl font-bold text-text">{{ stats?.content.posts ?? 0 }}</p>
          <p class="text-text/40 text-xs mt-1">{{ homeCount }} / 4 on home</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Reviews</p>
          <p class="text-2xl font-bold text-text">{{ stats?.content.reviews ?? 0 }}</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Likes</p>
          <p class="text-2xl font-bold text-text">{{ stats?.content.likes ?? 0 }}</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">On portfolio</p>
          <p class="text-2xl font-bold text-primary">
            {{ portfolioCount }}<span class="text-text/40 text-base font-normal"> / 4</span>
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Best sellers -->
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <h2 class="text-sm font-bold uppercase tracking-wide text-text/70 mb-4">Best sellers</h2>
          <div v-if="topSellers.length" class="flex flex-col gap-3">
            <NuxtLink
              v-for="(item, i) in topSellers"
              :key="item.id"
              :to="`/browse/${item.slug}`"
              class="flex items-center gap-3 rounded-lg hover:bg-white/[0.03] transition-colors p-2 -mx-2"
            >
              <span class="text-text/30 font-black text-sm w-4 shrink-0">{{ i + 1 }}</span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-text text-sm truncate">{{ item.title }}</p>
                <p class="text-text/40 text-xs">{{ item.sales }} sold</p>
              </div>
              <span class="text-primary font-bold text-sm shrink-0">€{{ item.revenue }}</span>
            </NuxtLink>
          </div>
          <p v-else class="text-text/40 text-sm py-4 text-center">Nothing sold yet.</p>
        </div>

        <!-- Recent posts -->
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-bold uppercase tracking-wide text-text/70">Recent posts</h2>
            <NuxtLink to="/app/posts" class="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-primary hover:text-secondary transition-colors">
              Manage
              <UIcon name="i-lucide-arrow-right" class="text-xs" />
            </NuxtLink>
          </div>
          <div class="flex flex-col gap-3">
            <NuxtLink
              v-for="post in recentPosts"
              :key="post.id"
              to="/app/posts"
              class="flex items-center gap-3 rounded-lg hover:bg-white/[0.03] transition-colors p-2 -mx-2"
            >
              <img :src="post.image_url" :alt="post.title" class="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" />
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-text text-sm truncate">{{ post.title }}</p>
              </div>
              <span v-if="post.featured_home" class="text-xs font-bold uppercase text-primary/70 shrink-0">Home</span>
              <span v-if="post.featured_portfolio" class="text-xs font-bold uppercase text-primary/70 shrink-0">Portfolio</span>
            </NuxtLink>
            <p v-if="!posts.length" class="text-text/40 text-sm py-4 text-center">No posts yet.</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'dashboard' })

interface Post {
  id: number
  title: string
  image_url: string
  featured_home: number
  featured_portfolio: number
}

interface Stats {
  users: {
    total: number
    verified: number
    unverified: number
    admins: number
    new_this_week: number
    new_this_month: number
    customers: number
  }
  sales: {
    count: number
    revenue: number
    count_this_month: number
    revenue_this_month: number
    pending: number
    needs_refund: number
    disputed: number
    conversion_percent: number
  }
  content: {
    browse_items: number
    browse_items_sellable: number
    posts: number
    reviews: number
    likes: number
  }
  top_sellers: { id: number, title: string, slug: string, sales: number, revenue: number }[]
  signups_per_day: { day: string, n: number }[]
  windows: { recent_days: number, week_days: number }
}

const user = useAuthUser()

const posts = ref<Post[]>([])
const stats = ref<Stats | null>(null)
const statsError = ref('')

// Both fetches are admin-only endpoints, so they only run for an admin --
// a customer reaching /app is redirected to /app/purchases by
// app/middleware/auth.global.ts, but guarding here too keeps a customer who
// somehow renders this page from firing two requests that would 403.
if (user.value?.role === 'admin') {
  const [{ data: postData }, { data: statsData, error: statsFetchError }] = await Promise.all([
    useFetch<Post[]>('/api/posts'),
    useFetch<Stats>('/api/admin/stats', { retry: false }),
  ])
  posts.value = postData.value ?? []
  stats.value = statsData.value ?? null
  if (statsFetchError.value) {
    statsError.value = 'Could not load statistics. The counters below may be empty.'
  }
}

const homeCount = computed(() => posts.value.filter(p => p.featured_home).length)
const portfolioCount = computed(() => posts.value.filter(p => p.featured_portfolio).length)
const recentPosts = computed(() => posts.value.slice(0, 5))
const topSellers = computed(() => stats.value?.top_sellers ?? [])

const attentionCount = computed(() => {
  const s = stats.value?.sales
  if (!s) return 0
  return s.needs_refund + s.disputed
})

const attentionDetail = computed(() => {
  const s = stats.value?.sales
  if (!s) return ''
  const parts: string[] = []
  if (s.needs_refund > 0) parts.push(`${s.needs_refund} duplicate purchase(s) owed a refund`)
  if (s.disputed > 0) parts.push(`${s.disputed} dispute(s)`)
  return parts.join(' · ')
})

// The last 7 calendar days, including days with no signups at all -- the API
// only returns days that HAVE rows, so a gap-free axis has to be built here
// or the bars would silently compress and misrepresent the trend.
const signupTrend = computed(() => {
  const byDay = new Map((stats.value?.signups_per_day ?? []).map(r => [r.day, r.n]))
  const days: { day: string, n: number, label: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000)
    // Same YYYY-MM-DD slice the API groups on, built from UTC so the two
    // agree regardless of the viewer's timezone.
    const day = d.toISOString().slice(0, 10)
    days.push({
      day,
      n: byDay.get(day) ?? 0,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
    })
  }
  return days
})

const maxSignups = computed(() => Math.max(1, ...signupTrend.value.map(d => d.n)))

// Scales to the tallest bar so a quiet week still shows shape. Zero stays a
// visible sliver rather than disappearing, so the axis reads as seven days.
function barHeightPercent(n: number): number {
  if (n === 0) return 4
  return Math.max(8, Math.round((n / maxSignups.value) * 100))
}

// Rounded to cents. Guarded against a zero sale count so an empty site shows
// 0 rather than NaN.
const averageOrder = computed(() => {
  const s = stats.value?.sales
  if (!s || s.count === 0) return 0
  return Math.round((s.revenue / s.count) * 100) / 100
})
</script>
