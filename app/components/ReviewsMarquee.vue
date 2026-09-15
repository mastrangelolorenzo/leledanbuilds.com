<template>
  <section id="reviews" class="relative bg-background py-10 md:py-14 overflow-hidden">

    <div class="relative max-w-3xl mx-auto flex flex-col items-center text-center px-4 mb-8">
      <h2 class="text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-text">
        What Creators <span class="text-secondary">Say</span>
      </h2>
      <p class="text-text/60 mt-3">Trusted by Minecraft content creators worldwide</p>
    </div>

    <UMarquee :overlay="false" :pauseOnHover="true" class="relative w-full py-2 [--gap:0.75rem]" :ui="{ content: 'justify-start w-max' }">
      <a
        v-for="review in reviews"
        :key="review.name"
        :href="review.link"
        target="_blank"
        rel="noopener noreferrer"
        class="flex flex-col gap-4 p-5 w-72 h-56 shrink-0 rounded-2xl bg-background-secondary/70 backdrop-blur-sm hover:bg-background-secondary/90 transition-all duration-300 hover:-translate-y-0.5"
      >
        <div class="flex items-center gap-3">
          <img :src="review.image" :alt="review.name" class="w-11 h-11 rounded-full object-cover border-2 border-secondary shrink-0" />
          <div class="flex flex-col leading-tight">
            <span class="text-text font-bold text-sm">{{ review.name }}</span>
            <span class="text-text/50 text-xs">{{ review.detail }} &middot; {{ review.counter }}</span>
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
const reviews = [
  {
    image: "/customers/zenith.webp",
    name: "Zenith",
    detail: "YouTuber",
    counter: "300k Subscribers",
    link: "https://www.youtube.com/@zenithminecraft",
    review:
      "This Minecraft build is an outstanding example of creativity and craftsmanship, showing remarkable attention to detail and design.",
  },
  {
    image: "/customers/divvy.webp",
    name: "Divvy",
    detail: "YouTuber",
    counter: "202k Subscribers",
    link: "https://www.youtube.com/@divvyminecraft",
    review:
      "Great builder, delivered exactly what I wanted in no time.",
  },
  {
    image: "/customers/cypro.webp",
    name: "Cypro",
    detail: "YouTuber",
    counter: "41.3k Subscribers",
    link: "https://www.youtube.com/@cyproh",
    review:
      "Very fast with constant updates, exactly everything I asked for!",
  },
  {
    image: "/customers/coralmc.webp",
    name: "CoralMC",
    detail: "Server",
    counter: "1000 users/day",
    link: "https://coralmc.it",
    review:
      "He fully respected our requirements, was available, professional and punctual. Recommended.",
  },
  {
    image: "/customers/gabby16bit.webp",
    name: "Gabby16bit",
    detail: "YouTuber",
    counter: "3.5M Subscribers",
    link: "https://www.youtube.com/@Gabby16bit",
    review:
      "Great builder, made several builds for my YouTube channel. Professional, fast and talented.",
  },
  {
    image: "/customers/yeslucid.webp",
    name: "yeslucid",
    detail: "YouTuber",
    counter: "168k Subscribers",
    link: "https://www.youtube.com/@yeslucid",
    review:
      "Excellent building skills! Delivered all the material needed with extreme promptness.",
  },
];
</script>
