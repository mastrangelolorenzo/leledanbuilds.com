<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <form class="w-full max-w-sm flex flex-col gap-4 bg-background-secondary p-8 rounded-2xl border border-white/10" @submit.prevent="submit">
      <h1 class="text-2xl font-bold text-primary">Create an account</h1>
      <UInput v-model="email" type="email" placeholder="Email" required />
      <UInput v-model="password" type="password" placeholder="Password (min. 8 characters)" required />
      <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
      <p v-if="success" class="text-green-400 text-sm">Account created! Check your email for a verification link before you can log in.</p>
      <UButton type="submit" :loading="loading" block>Register</UButton>
      <NuxtLink to="/app/login" class="text-sm text-text/60 hover:text-primary text-center">Already have an account? Log in</NuxtLink>
    </form>
  </div>
</template>

<script lang="ts" setup>
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: { email: email.value, password: password.value } })
    success.value = true
  } catch (e: unknown) {
    error.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>
