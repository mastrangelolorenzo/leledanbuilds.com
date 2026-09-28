<template>
  <div class="inline-flex flex-col items-start">
    <button
      type="button"
      class="inline-flex items-center rounded-full border font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      :class="[
        size === 'lg' ? 'gap-2 px-5 py-2.5 text-sm' : 'gap-1.5 px-2.5 py-1.5 text-xs',
        liked
          ? 'bg-red-500/15 border-red-500/50 text-red-500'
          : 'bg-black/30 border-white/15 text-text/70 hover:border-primary/40 hover:text-primary',
      ]"
      :disabled="pending"
      :aria-pressed="liked"
      :aria-label="liked ? 'Unlike this build' : 'Like this build'"
      @click.stop="handleClick"
    >
      <span
        :key="popKey"
        class="inline-flex"
        :class="justLiked ? 'like-pop' : ''"
        @animationend="justLiked = false"
      >
        <UIcon
          name="i-lucide-heart"
          mode="svg"
          :class="[size === 'lg' ? 'text-base' : 'text-sm', liked ? '[&_path]:fill-current' : '']"
        />
      </span>
      <span>{{ count }}</span>
    </button>
    <p v-if="errorMessage" class="text-red-400 text-[11px] mt-1 max-w-[10rem]">{{ errorMessage }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { optimisticLikeToggle } from '../utils/likeToggle'

// Holds its own state so neither call site (the catalog grid or the detail
// page) has to own like state, but stays in sync with the props: without the
// watcher below, a client-side remount — paginating the catalog away and back
// — would redisplay the state from the initial page load and silently discard
// a toggle the visitor just made.
const props = withDefaults(
  defineProps<{
    browseItemId: number
    slug: string
    likeCount: number
    likedByMe: boolean
    // 'sm' keeps the compact form used in the catalog grid; 'lg' is the
    // product page, where this reads as a real button next to the price.
    size?: 'sm' | 'lg'
  }>(),
  { size: 'sm' }
)

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

// Drives the pop animation. `popKey` re-keys the wrapper so the CSS animation
// restarts on every like rather than only the first; `justLiked` is what
// actually applies the class, and clears itself on animationend.
const justLiked = ref(false)
const popKey = ref(0)

watch(
  () => [props.likedByMe, props.likeCount] as const,
  ([likedByMe, likeCount]) => {
    // Never clobber an in-flight optimistic update with a stale prop value.
    if (pending.value) return
    liked.value = likedByMe
    count.value = likeCount
  }
)

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
  // Only liking pops; un-liking is a quiet state change.
  if (optimistic.liked_by_me) {
    popKey.value++
    justLiked.value = true
  }
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

<style scoped>
/* Transform only, so the pop can never nudge neighbouring cards in the grid. */
@keyframes like-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.35); }
  70% { transform: scale(0.92); }
  100% { transform: scale(1); }
}

.like-pop {
  animation: like-pop 320ms ease-out;
}

/* Someone who has asked their OS for less motion still gets the colour
   change — they just don't get the movement. */
@media (prefers-reduced-motion: reduce) {
  .like-pop {
    animation: none;
  }
}
</style>
