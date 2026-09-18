<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
      <p class="text-text/50 text-sm mt-1">Welcome back{{ user?.role === 'admin' ? ', admin' : '' }}.</p>
    </div>

    <template v-if="user?.role === 'admin'">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Total posts</p>
          <p class="text-3xl font-bold text-text">{{ posts.length }}</p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Featured on Home</p>
          <p class="text-3xl font-bold text-primary">
            {{ homeCount }}<span class="text-text/40 text-lg font-normal"> / 4</span>
          </p>
        </div>
        <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
          <p class="text-text/50 text-xs uppercase tracking-wide font-semibold mb-2">Featured on Portfolio</p>
          <p class="text-3xl font-bold text-primary">
            {{ portfolioCount }}<span class="text-text/40 text-lg font-normal"> / 4</span>
          </p>
        </div>
      </div>

      <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-bold uppercase tracking-wide text-text/70">Recent posts</h2>
          <NuxtLink to="/app/posts" class="inline-flex items-center gap-1.5 text-sm font-bold uppercase text-primary hover:text-secondary transition-colors">
            Manage posts
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
    </template>

    <p v-else class="text-text/60">Nothing here yet — check back soon.</p>
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

const user = useAuthUser()

const posts = ref<Post[]>([])
if (user.value?.role === 'admin') {
  const { data } = await useFetch<Post[]>('/api/posts')
  posts.value = data.value ?? []
}

const homeCount = computed(() => posts.value.filter(p => p.featured_home).length)
const portfolioCount = computed(() => posts.value.filter(p => p.featured_portfolio).length)
const recentPosts = computed(() => posts.value.slice(0, 5))
</script>
