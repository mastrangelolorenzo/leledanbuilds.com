<template>
  <!-- Nothing flagged means no section at all, rather than an empty strip on
       the home page. -->
  <section v-if="skinpacks?.length" class="bg-background py-14 md:py-20 px-4">
    <div class="max-w-6xl mx-auto flex flex-col items-center">
      <h2 class="text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-center gold-glow">
        Skinpacks
      </h2>
      <p class="text-text/70 text-center max-w-xl mt-3 mb-10">
        Character packs to match the builds.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
        <NuxtLink
          v-for="pack in skinpacks"
          :key="pack.id"
          :to="`/browse/${pack.slug}`"
          class="group relative rounded-2xl overflow-hidden border-2 border-primary/40 hover:border-primary transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <img
            :src="pack.image_url"
            :alt="pack.title"
            class="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
            draggable="false"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-3">
            <h3 class="text-white font-bold uppercase text-sm tracking-wide">{{ pack.title }}</h3>
            <span class="text-secondary text-xs font-semibold inline-flex items-center gap-1">
              View Pack <UIcon name="i-lucide-arrow-right" class="text-xs" />
            </span>
          </div>
        </NuxtLink>
      </div>

      <NuxtLink
        to="/skinpacks"
        class="inline-flex items-center gap-2 mt-10 text-base font-bold uppercase bg-transparent border-2 border-primary text-primary rounded-xl px-6 py-3 hover:bg-primary hover:text-black transition-all duration-300"
      >
        Browse All Skinpacks
        <UIcon name="i-lucide-arrow-right" class="text-lg" />
      </NuxtLink>
    </div>
  </section>
</template>

<script lang="ts" setup>
interface HomeSkinpack {
  id: number
  slug: string
  title: string
  image_url: string
  category: string
}

// Which packs appear is set per item in /app/browse; the endpoint returns
// only the flagged ones, so there is nothing to filter here.
const { data: skinpacks } = await useFetch<HomeSkinpack[]>('/api/browse-items/home-skinpacks', { retry: false })
</script>
