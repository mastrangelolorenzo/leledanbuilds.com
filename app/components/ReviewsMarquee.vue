<template>
  <section id="reviews" class="relative bg-background py-10 md:py-14 overflow-hidden">

    <div class="relative max-w-3xl mx-auto flex flex-col items-center text-center px-4 mb-8">
      <h2 class="text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-text">
        What Creators <span class="text-secondary">Say</span>
      </h2>
      <p class="text-text/60 mt-3">Trusted by Minecraft content creators worldwide</p>
    </div>

    <p v-if="!reviews?.length" class="text-text/50 text-center py-8">
      Reviews are temporarily unavailable — check back soon.
    </p>
    <UMarquee v-else :overlay="false" :pauseOnHover="true" class="relative w-full py-2 [--gap:0.75rem]" :ui="{ content: 'justify-start w-max' }">
      <a
        v-for="review in reviews ?? []"
        :key="review.id"
        :href="review.link"
        target="_blank"
        rel="noopener noreferrer"
        class="flex flex-col gap-4 p-5 w-72 h-56 shrink-0 rounded-2xl bg-background-secondary/70 backdrop-blur-sm hover:bg-background-secondary/90 transition-all duration-300 hover:-translate-y-0.5"
      >
        <div class="flex items-center gap-3">
          <img :src="review.image_url" :alt="review.name" class="w-11 h-11 rounded-full object-cover border-2 border-secondary shrink-0" />
          <div class="flex flex-col leading-tight">
            <span class="text-text font-bold text-sm">{{ review.name }}</span>
            <span class="text-text/50 text-xs">{{ review.detail }}<template v-if="review.counter"> &middot; {{ review.counter }}</template></span>
          </div>
        </div>
        <p class="text-text/80 text-sm leading-relaxed line-clamp-4">{{ review.review }}</p>
        <div class="flex gap-1 mt-auto">
          <UIcon name="i-heroicons-star-solid" class="w-4 h-4 text-secondary" v-for="n in 5" :key="n" />
        </div>
      </a>
    </UMarquee>
  </section>
</template>

<script lang="ts" setup>
interface Review {
  id: number
  name: string
  image_url: string
  detail: string
  counter: string
  link: string
  review: string
}
const { data: reviews } = await useFetch<Review[]>('/api/reviews');
</script>
