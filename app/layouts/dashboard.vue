<template>
  <div class="min-h-screen bg-background flex flex-col md:flex-row">
    <!-- Mobile top bar -->
    <div class="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-background-secondary/60 sticky top-0 z-20">
      <NuxtLink to="/" class="flex items-center gap-2">
        <img src="/images/logo.png" alt="leledan06 logo" class="h-7 w-auto object-contain" />
        <span class="text-primary font-extrabold tracking-wide uppercase text-xs">leledan06</span>
      </NuxtLink>
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/app"
          class="text-xs font-bold uppercase tracking-wide"
          :class="isActive('/app') ? 'text-primary' : 'text-text/60'"
        >
          Dashboard
        </NuxtLink>
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/app/posts"
          class="text-xs font-bold uppercase tracking-wide"
          :class="isActive('/app/posts') ? 'text-primary' : 'text-text/60'"
        >
          Posts
        </NuxtLink>
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/app/work-seen-on"
          class="text-xs font-bold uppercase tracking-wide"
          :class="isActive('/app/work-seen-on') ? 'text-primary' : 'text-text/60'"
        >
          Work Seen On
        </NuxtLink>
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/app/reviews"
          class="text-xs font-bold uppercase tracking-wide"
          :class="isActive('/app/reviews') ? 'text-primary' : 'text-text/60'"
        >
          Reviews
        </NuxtLink>
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/app/pricing"
          class="text-xs font-bold uppercase tracking-wide"
          :class="isActive('/app/pricing') ? 'text-primary' : 'text-text/60'"
        >
          Pricing
        </NuxtLink>
        <button class="text-text/60 hover:text-primary transition-colors" aria-label="Log out" @click="logout">
          <UIcon name="i-lucide-log-out" class="text-lg" />
        </button>
      </div>
    </div>

    <!-- Desktop sidebar -->
    <aside class="hidden md:flex md:flex-col w-60 shrink-0 border-r border-white/10 bg-background-secondary/40 p-5">
      <NuxtLink to="/" class="flex items-center gap-2 mb-10 px-1">
        <img src="/images/logo.png" alt="leledan06 logo" class="h-8 w-auto object-contain" />
        <span class="text-primary font-extrabold tracking-wide uppercase text-sm">leledan06</span>
      </NuxtLink>

      <nav class="flex flex-col gap-1">
        <NuxtLink
          to="/app"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          :class="isActive('/app') ? 'bg-primary/10 text-primary' : 'text-text/70 hover:bg-white/5 hover:text-text'"
        >
          <UIcon name="i-lucide-layout-dashboard" class="text-base shrink-0" />
          Dashboard
        </NuxtLink>
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/app/posts"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          :class="isActive('/app/posts') ? 'bg-primary/10 text-primary' : 'text-text/70 hover:bg-white/5 hover:text-text'"
        >
          <UIcon name="i-lucide-image" class="text-base shrink-0" />
          Posts
        </NuxtLink>
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/app/work-seen-on"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          :class="isActive('/app/work-seen-on') ? 'bg-primary/10 text-primary' : 'text-text/70 hover:bg-white/5 hover:text-text'"
        >
          <UIcon name="i-lucide-users" class="text-base shrink-0" />
          Work Seen On
        </NuxtLink>
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/app/reviews"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          :class="isActive('/app/reviews') ? 'bg-primary/10 text-primary' : 'text-text/70 hover:bg-white/5 hover:text-text'"
        >
          <UIcon name="i-lucide-star" class="text-base shrink-0" />
          Reviews
        </NuxtLink>
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/app/pricing"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          :class="isActive('/app/pricing') ? 'bg-primary/10 text-primary' : 'text-text/70 hover:bg-white/5 hover:text-text'"
        >
          <UIcon name="i-lucide-tag" class="text-base shrink-0" />
          Pricing
        </NuxtLink>
      </nav>

      <div class="mt-auto pt-4 border-t border-white/10">
        <span
          class="inline-block mb-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
          :class="user?.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-white/10 text-text/70'"
        >
          {{ user?.role === 'admin' ? 'Admin' : 'Member' }}
        </span>
        <UButton color="neutral" variant="outline" block size="sm" @click="logout">
          <UIcon name="i-lucide-log-out" class="text-sm" />
          Log out
        </UButton>
      </div>
    </aside>

    <main class="flex-1 min-w-0 p-6 md:p-10">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const user = useAuthUser()

function isActive(path: string) {
  return route.path === path
}

async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } finally {
    user.value = null
    await navigateTo('/app/login')
  }
}
</script>
