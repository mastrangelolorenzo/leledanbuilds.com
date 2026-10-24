<template>
  <div class="inline-flex flex-col items-start">
    <div class="inline-flex items-center gap-1.5">
      <div class="inline-flex items-center" role="radiogroup" :aria-label="`Rate ${slug}`">
        <button
          v-for="star in 5"
          :key="star"
          type="button"
          class="p-0.5 transition-transform duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:scale-110"
          :disabled="pending"
          role="radio"
          :aria-checked="myRating === star"
          :aria-label="`${star} ${star === 1 ? 'star' : 'stars'}`"
          @click.stop="rate(star)"
          @mouseenter="hovered = star"
          @mouseleave="hovered = 0"
        >
          <UIcon
            name="i-lucide-star"
            mode="svg"
            :class="[
              size === 'lg' ? 'text-xl' : 'text-sm',
              star <= litUpTo ? 'text-primary [&_path]:fill-current' : 'text-text/25',
            ]"
          />
        </button>
      </div>
      <span :class="size === 'lg' ? 'text-sm' : 'text-[11px]'" class="text-text/60 font-semibold">
        <template v-if="count > 0">{{ average.toFixed(1) }} ({{ count }})</template>
        <template v-else>Not rated</template>
      </span>
    </div>
    <p v-if="errorMessage" class="text-red-400 text-[11px] mt-1 max-w-[12rem]">{{ errorMessage }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'

// Same shape and reasons as LikeButton: owns its display state so neither
// call site has to, but re-syncs from the props, because a client-side
// remount (paginating away and back) would otherwise show the numbers from
// the first page load and discard a rating just given.
const props = withDefaults(
  defineProps<{
    browseItemId: number
    slug: string
    ratingAvg: number
    ratingCount: number
    // 0 when the visitor has not rated this item (or is not signed in).
    myRating?: number
    size?: 'sm' | 'lg'
  }>(),
  { myRating: 0, size: 'sm' }
)

// The global auth middleware only fills this on /app/*, so the public pages
// fetch /api/auth/me themselves before this mounts. Reading the shared state
// here keeps the component reactive to login without prop drilling.
const user = useAuthUser()

const average = ref(props.ratingAvg)
const count = ref(props.ratingCount)
const myRating = ref(props.myRating)
const hovered = ref(0)
const pending = ref(false)
const errorMessage = ref('')

// Hovering previews the score you are about to give; otherwise the stars
// show your own rating if you have one, and the public average if you have
// not. Rounded so a 3.4 average lights three stars, not three and a bit.
const litUpTo = computed(() => {
  if (hovered.value > 0) return hovered.value
  if (myRating.value > 0) return myRating.value
  return Math.round(average.value)
})

watch(
  () => [props.ratingAvg, props.ratingCount, props.myRating] as const,
  ([avg, c, mine]) => {
    if (pending.value) return
    average.value = avg
    count.value = c
    myRating.value = mine
  }
)

async function rate(star: number) {
  if (pending.value) return

  if (!user.value) {
    await navigateTo(`/app/login?redirect=/browse/${props.slug}`)
    return
  }

  errorMessage.value = ''
  const before = { average: average.value, count: count.value, mine: myRating.value }
  // Optimistic only for the star the visitor pressed -- the average is left
  // alone until the server answers, because guessing it client-side needs
  // the sum of everyone else's scores, which this component does not have.
  myRating.value = star
  pending.value = true

  try {
    const res = await $fetch<{ my_rating: number, rating_avg: number, rating_count: number }>(
      `/api/browse-items/${props.browseItemId}/rating`,
      { method: 'PUT', body: { rating: star } }
    )
    myRating.value = res.my_rating
    average.value = res.rating_avg
    count.value = res.rating_count
  } catch (e: unknown) {
    average.value = before.average
    count.value = before.count
    myRating.value = before.mine
    errorMessage.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Could not save your rating. Please try again.'
  } finally {
    pending.value = false
  }
}
</script>
