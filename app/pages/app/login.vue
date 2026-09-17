<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <form class="w-full max-w-sm flex flex-col gap-4 bg-background-secondary p-8 rounded-2xl border border-white/10" @submit.prevent="submit">
      <h1 class="text-2xl font-bold text-primary">Log in</h1>
      <UInput v-model="email" type="email" placeholder="Email" required />
      <UInput v-model="password" type="password" placeholder="Password" required />
      <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
      <UButton type="submit" :loading="loading" block>Log in</UButton>
      <NuxtLink to="/app/register" class="text-sm text-text/60 hover:text-primary text-center">Need an account? Register</NuxtLink>
    </form>
  </div>
</template>

<script lang="ts" setup>
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await navigateTo('/app')
  } catch (e: unknown) {
    error.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Login failed.'
  } finally {
    loading.value = false
  }
}
</script>
