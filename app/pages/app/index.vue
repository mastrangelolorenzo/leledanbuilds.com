<template>
  <div class="min-h-screen p-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-primary">Dashboard</h1>
      <UButton color="neutral" variant="outline" @click="logout">Log out</UButton>
    </div>

    <NuxtLink v-if="me?.role === 'admin'" to="/app/posts" class="text-primary hover:text-secondary underline">
      Manage posts →
    </NuxtLink>
    <p v-else class="text-text/60">Nothing here yet — check back soon.</p>
  </div>
</template>

<script lang="ts" setup>
const { data: me } = await useFetch('/api/auth/me')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/app/login')
}
</script>
