<template>
  <div class="inline-flex flex-col items-start">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      :class="justCopied
        ? 'bg-primary/15 border-primary/40 text-primary'
        : 'bg-black/30 border-white/15 text-text/70 hover:border-primary/40 hover:text-primary'"
      :disabled="pending"
      aria-label="Share this build"
      @click.stop="handleShare"
    >
      <UIcon
        :name="justCopied ? 'i-lucide-check' : 'i-lucide-share-2'"
        mode="svg"
        class="text-sm"
      />
      <span>{{ justCopied ? 'Link copied' : 'Share' }}</span>
    </button>
    <p v-if="errorMessage" class="text-red-400 text-[11px] mt-1 max-w-[10rem]">{{ errorMessage }}</p>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, ref } from 'vue'

// Unlike LikeButton, this needs no account and no props tying it to a
// specific browse item beyond a human-readable title -- the URL it shares
// is always just the current page (window.location.href), which is what
// makes this safe to use for anonymous visitors with zero server round-trip.
const props = defineProps<{
  title: string
}>()

const pending = ref(false)
const justCopied = ref(false)
const errorMessage = ref('')
let revertTimer: ReturnType<typeof setTimeout> | null = null

onBeforeUnmount(() => {
  if (revertTimer) clearTimeout(revertTimer)
})

async function handleShare() {
  if (pending.value) return
  errorMessage.value = ''
  // Read at click-time (not derived/cached) so it's always the exact URL
  // the visitor currently has open, correct in every environment (local
  // dev, preview, production) with no server-side "canonical URL" config.
  const url = window.location.href

  if (typeof navigator.share === 'function') {
    pending.value = true
    try {
      await navigator.share({ title: props.title, url })
      pending.value = false
      return
    } catch (e: unknown) {
      pending.value = false
      // The user dismissing the OS share sheet is not an error -- navigator
      // .share() rejects with AbortError in that case. Stop here silently;
      // do NOT fall through to the clipboard path, since the visitor made
      // an active choice not to share.
      if ((e as { name?: string })?.name === 'AbortError') {
        return
      }
      // A genuine failure (permission denied, no share targets, etc.) falls
      // through to the clipboard fallback below instead of dead-ending here.
    }
  }

  await copyToClipboard(url)
}

async function copyToClipboard(url: string) {
  if (typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(url)
      showCopiedConfirmation()
      return
    } catch {
      // Fall through to the readable-message path below.
    }
  }
  errorMessage.value = 'Could not share or copy the link. Please copy the page URL manually.'
}

function showCopiedConfirmation() {
  justCopied.value = true
  if (revertTimer) clearTimeout(revertTimer)
  revertTimer = setTimeout(() => {
    justCopied.value = false
  }, 2000)
}
</script>
