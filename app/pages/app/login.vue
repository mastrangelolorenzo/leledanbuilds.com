<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <form class="w-full max-w-sm flex flex-col gap-4 bg-background-secondary p-8 rounded-2xl border border-white/10" @submit.prevent="submit">
      <h1 class="text-2xl font-bold text-primary">Log in</h1>
      <p v-if="verifiedBanner" class="text-green-400 text-sm text-center">Email verified! You can now log in.</p>
      <p v-if="verifyErrorBanner" class="text-red-400 text-sm text-center">That verification link is invalid or has expired. Register again or use "Resend verification email" below after attempting to log in.</p>
      <UInput v-model="email" type="email" placeholder="Email" required />
      <UInput v-model="password" type="password" placeholder="Password" required />
      <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
      <button
        v-if="showResend"
        type="button"
        class="text-sm text-primary hover:text-secondary text-center underline"
        :disabled="resending"
        @click="resendVerification"
      >
        Resend verification email
      </button>
      <p v-if="resendMessage" class="text-green-400 text-sm">{{ resendMessage }}</p>
      <UButton type="submit" :loading="loading" block>Log in</UButton>
      <NuxtLink to="/app/register" class="text-sm text-text/60 hover:text-primary text-center">Need an account? Register</NuxtLink>
    </form>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const verifiedBanner = route.query.verified === '1'
const verifyErrorBanner = route.query.verify_error === '1'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showResend = ref(false)
const resending = ref(false)
const resendMessage = ref('')

async function submit() {
  error.value = ''
  showResend.value = false
  resendMessage.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await navigateTo('/app')
  } catch (e: unknown) {
    const err = e as { statusCode?: number, data?: { statusMessage?: string } }
    error.value = err.data?.statusMessage ?? 'Login failed.'
    if (err.statusCode === 403) {
      showResend.value = true
    }
  } finally {
    loading.value = false
  }
}

async function resendVerification() {
  resending.value = true
  resendMessage.value = ''
  try {
    const res = await $fetch<{ message: string }>('/api/auth/resend-verification', { method: 'POST', body: { email: email.value } })
    resendMessage.value = res.message
  } catch {
    resendMessage.value = 'Could not resend right now — try again shortly.'
  } finally {
    resending.value = false
  }
}
</script>
