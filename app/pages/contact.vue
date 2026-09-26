<template>
  <div class="bg-background min-h-screen">
    <NavBar class="sticky top-0 z-10" />

    <div class="relative overflow-hidden py-14 md:py-20 px-6">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none"></div>
      <div class="relative max-w-6xl mx-auto flex flex-col items-center text-center mb-14">
        <span class="flex items-center gap-3 text-secondary text-xs md:text-sm uppercase tracking-[0.25em] font-bold mb-4">
          <span class="w-9 h-px bg-secondary"></span>
          Get In Touch
          <span class="w-9 h-px bg-secondary"></span>
        </span>
        <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tight text-text">
          Let's <span class="text-primary">Talk</span>
        </h1>
        <p class="text-text/60 mt-3">Questions, custom builds, or just want to say hi — we're here.</p>
      </div>

      <div class="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
        <!-- Send us a message -->
        <div class="bg-background-secondary border border-white/10 rounded-3xl p-6 md:p-8">
          <div class="flex items-center gap-3 mb-6">
            <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
              <UIcon name="i-lucide-send" class="text-lg" />
            </span>
            <h2 class="text-xl font-bold text-text">Send us a message</h2>
          </div>

          <form class="flex flex-col gap-4" @submit.prevent="submit">
            <UFormField label="Name" required>
              <UInput v-model="form.name" placeholder="Your name" size="lg" class="w-full" :ui="{ base: 'rounded-2xl' }" />
            </UFormField>

            <UFormField label="Email" required>
              <UInput v-model="form.email" type="email" placeholder="youremail.com" size="lg" class="w-full" :ui="{ base: 'rounded-2xl' }" />
            </UFormField>

            <UFormField label="Inquiry type" required>
              <USelect v-model="form.inquiryType" :items="INQUIRY_TYPES" placeholder="Select inquiry type" size="lg" class="w-full rounded-2xl" />
            </UFormField>

            <UFormField label="Message" required>
              <UTextarea
                v-model="form.message"
                placeholder="Tell us how we can help…"
                :rows="6"
                :maxlength="MAX_MESSAGE_LENGTH"
                size="lg"
                class="w-full"
                :ui="{ base: 'rounded-3xl' }"
              />
              <p class="text-text/40 text-xs text-right mt-1">{{ form.message.length }}/{{ MAX_MESSAGE_LENGTH }}</p>
            </UFormField>

            <p v-if="errorMessage" class="text-red-400 text-sm">{{ errorMessage }}</p>
            <p v-if="successMessage" class="text-primary text-sm">{{ successMessage }}</p>

            <UButton type="submit" :loading="sending" block size="lg" class="rounded-full">
              Send Message
              <UIcon name="i-lucide-arrow-right" class="text-base" />
            </UButton>
          </form>
        </div>

        <!-- Other ways to reach out -->
        <div class="bg-background-secondary border border-white/10 rounded-3xl p-6 md:p-8">
          <div class="flex items-center gap-3 mb-2">
            <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
              <UIcon name="i-lucide-message-circle" class="text-lg" />
            </span>
            <h2 class="text-xl font-bold text-text">Other ways to reach out</h2>
          </div>
          <p class="text-text/50 text-sm mb-6">Connect with us on your preferred platform</p>

          <div class="flex flex-col gap-3">
            <a
              v-for="channel in channels"
              :key="channel.name"
              :href="channel.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center gap-3 bg-background border border-white/10 rounded-2xl px-4 py-3.5 hover:border-primary/40 transition-colors"
            >
              <span class="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 text-text shrink-0">
                <UIcon :name="channel.icon" class="text-lg" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block font-bold text-text text-sm">{{ channel.name }}</span>
                <span class="block text-text/50 text-xs truncate">{{ channel.handle }}</span>
              </span>
              <UIcon name="i-lucide-arrow-right" class="text-text/40 group-hover:text-primary transition-colors shrink-0" />
            </a>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <FaqAccordion />
    </div>
  </div>
</template>

<script lang="ts" setup>
const INQUIRY_TYPES = ['General Question', 'Custom Build Request', 'Order Support', 'Business Inquiry', 'Other'] as const
const MAX_MESSAGE_LENGTH = 2000

const channels = [
  { name: 'Instagram', handle: '@leledan.builds', icon: 'i-simple-icons-instagram', url: 'https://www.instagram.com/leledan.builds/' },
  { name: 'Email', handle: 'leledanbusiness@gmail.com', icon: 'i-simple-icons-gmail', url: 'mailto:leledanbusiness@gmail.com' },
  { name: 'Discord', handle: '@leledan06', icon: 'i-simple-icons-discord', url: 'https://discord.gg/u9FyUqa6uz' },
  { name: 'YouTube', handle: '@leledan06', icon: 'i-simple-icons-youtube', url: 'https://www.youtube.com/@leledan06' },
]

const form = reactive({
  name: '',
  email: '',
  inquiryType: '',
  message: '',
})

const sending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function submit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!form.name || !form.email || !form.inquiryType || !form.message) {
    errorMessage.value = 'Please fill in every field before sending.'
    return
  }

  sending.value = true
  try {
    await $fetch('/api/contact', { method: 'POST', body: { ...form } })
    successMessage.value = "Message sent! We'll get back to you soon."
    form.name = ''
    form.email = ''
    form.inquiryType = ''
    form.message = ''
  } catch (e: unknown) {
    errorMessage.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Could not send your message. Please try again.'
  } finally {
    sending.value = false
  }
}
</script>
