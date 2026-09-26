<template>
  <div class="inline-flex flex-col items-start">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      :class="liked
        ? 'bg-primary/15 border-primary/40 text-primary'
        : 'bg-black/30 border-white/15 text-text/70 hover:border-primary/40 hover:text-primary'"
      :disabled="pending"
      :aria-pressed="liked"
      :aria-label="liked ? 'Unlike this build' : 'Like this build'"
      @click.stop="handleClick"
    >
      <UIcon
        name="i-lucide-heart"
        mode="svg"
        class="text-sm"
        :class="liked ? '[&_path]:fill-current' : ''"
      />
      <span>{{ count }}</span>
    </button>
    <p v-if="errorMessage" class="text-red-400 text-[11px] mt-1 max-w-[10rem]">{{ errorMessage }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { optimisticLikeToggle } from '../utils/likeToggle'

// Self-contained: seeds its own local state from the initial props and
// never needs the parent page to hold or update like state afterwards.
// Nothing else in the app mutates like_count/liked_by_me, so this is safe
// and avoids prop-drilling an update back up for two call sites that don't
// otherwise share state (the catalog grid and the single-item detail page).
const props = defineProps<{
  browseItemId: number
  slug: string
  likeCount: number
  likedByMe: boolean
}>()

// Same pattern both browse pages use to know about a logged-in visitor:
// the global auth middleware (app/middleware/auth.global.ts) only populates
// this for /app/* routes, so both app/pages/browse/index.vue and
// app/pages/browse/[slug].vue fetch /api/auth/me themselves before this
// component ever mounts. Reading the same useState key here (rather than
// requiring it as a prop) keeps this component reactive to login/logout
// without either page having to forward it down.
const user = useAuthUser()

const liked = ref(props.likedByMe)
const count = ref(props.likeCount)
const pending = ref(false)
const errorMessage = ref('')

async function handleClick() {
  if (pending.value) return

  if (!user.value) {
    // Same pattern as the Buy button on the detail page: send an anonymous
    // visitor to log in, with a same-origin redirect back to the product
    // they were looking at. isSafeRedirect (used by app/pages/app/login.vue)
    // only ever accepts a path shaped like this one, so no change is needed
    // there.
    await navigateTo(`/app/login?redirect=/browse/${props.slug}`)
    return
  }

  errorMessage.value = ''
  const before = { liked: liked.value, count: count.value }
  const optimistic = optimisticLikeToggle({ liked_by_me: liked.value, like_count: count.value })
  liked.value = optimistic.liked_by_me
  count.value = optimistic.like_count
  pending.value = true

  try {
    const res = await $fetch<{ liked: boolean, like_count: number }>(
      `/api/browse-items/${props.browseItemId}/like`,
      { method: 'POST' }
    )
    // Reconcile with the server's real numbers rather than trusting the
    // optimistic guess -- other visitors may be liking the same item
    // concurrently.
    liked.value = res.liked
    count.value = res.like_count
  } catch (e: unknown) {
    liked.value = before.liked
    count.value = before.count
    errorMessage.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Could not update like. Please try again.'
  } finally {
    pending.value = false
  }
}
</script>
