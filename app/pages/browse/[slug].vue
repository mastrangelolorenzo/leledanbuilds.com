<template>
  <div class="bg-background min-h-screen">
    <NavBar class="sticky top-0 z-10" />

    <div v-if="build" class="relative overflow-hidden py-14 md:py-20 px-6 md:px-10 lg:px-16">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none"></div>

      <div class="relative max-w-6xl mx-auto">
        <NuxtLink to="/browse" class="inline-flex items-center gap-2 text-text/60 hover:text-primary transition-colors text-sm font-semibold mb-8">
          <UIcon name="i-lucide-arrow-left" />
          Back to Browse
        </NuxtLink>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <img
            :src="build.image"
            :alt="build.title"
            class="w-full aspect-square object-cover rounded-2xl border border-white/10"
            draggable="false"
          />

          <div class="flex flex-col">
            <h1 class="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-4">
              {{ build.title }}
            </h1>

            <div class="flex flex-wrap items-center gap-2 mb-5">
              <span class="px-3 py-1 rounded-full border border-primary/40 text-primary text-xs font-semibold uppercase tracking-wide">{{ build.buildType }}</span>
              <span class="px-3 py-1 rounded-full border border-white/20 text-text/70 text-xs font-semibold uppercase tracking-wide">{{ build.theme }}</span>
              <span class="px-3 py-1 rounded-full border border-white/20 text-text/70 text-xs font-semibold uppercase tracking-wide">{{ build.category }}</span>
            </div>

            <p class="text-text/80 leading-relaxed mb-6">{{ build.description }}</p>

            <dl class="grid grid-cols-2 gap-4 mb-8 border-t border-white/10 pt-6">
              <div>
                <dt class="text-text/40 text-xs uppercase tracking-widest font-bold mb-1">Difficulty</dt>
                <dd class="flex items-center gap-2">
                  <span class="text-text font-semibold text-sm">{{ build.difficulty }}</span>
                  <span class="flex items-center gap-1">
                    <span
                      v-for="n in 4"
                      :key="n"
                      class="w-2.5 h-2.5 rounded-sm"
                      :class="n <= difficultyLevels[build.difficulty] ? 'bg-primary' : 'bg-white/15'"
                    ></span>
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-text/40 text-xs uppercase tracking-widest font-bold mb-1">Released</dt>
                <dd class="text-text font-semibold text-sm">
                  {{ new Date(build.released).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
                </dd>
              </div>
              <div>
                <dt class="text-text/40 text-xs uppercase tracking-widest font-bold mb-1">Category</dt>
                <dd class="text-text font-semibold text-sm">{{ build.category }}</dd>
              </div>
              <div>
                <dt class="text-text/40 text-xs uppercase tracking-widest font-bold mb-1">Theme</dt>
                <dd class="text-text font-semibold text-sm">{{ build.theme }}</dd>
              </div>
            </dl>

            <div class="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
              <span class="text-primary font-black text-4xl">€{{ build.price }}</span>
              <a
                href="https://discord.gg/u9FyUqa6uz"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 bg-primary text-black font-bold uppercase text-sm rounded-full px-6 py-3 hover:bg-secondary transition-all duration-300"
              >
                Buy
                <UIcon name="i-lucide-arrow-right" class="text-base" />
              </a>
            </div>
          </div>
        </div>

        <!-- You might also like -->
        <div v-if="relatedBuilds.length" class="mt-20">
          <h2 class="text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-white mb-8">
            You might also like
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <NuxtLink
              v-for="item in relatedBuilds"
              :key="item.slug"
              :to="`/browse/${item.slug}`"
              class="group relative bg-background-secondary border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1"
            >
              <img
                :src="item.image"
                :alt="item.title"
                class="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                draggable="false"
              />
              <div class="p-4 flex flex-col flex-1">
                <h3 class="text-white font-extrabold uppercase text-sm tracking-wide mb-2">{{ item.title }}</h3>
                <span class="text-primary font-black text-lg mt-auto">€{{ item.price }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-32 gap-4">
      <p class="text-text/60">This build doesn't exist.</p>
      <NuxtLink to="/browse" class="text-primary font-semibold hover:text-secondary transition-colors">Back to Browse</NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "#app";
import { products, difficultyLevels } from "~/data/products";

const route = useRoute();

const build = computed(() =>
  products.find((p) => p.slug === route.params.slug)
);

const relatedBuilds = computed(() => {
  if (!build.value) return [];
  return products
    .filter(
      (p) =>
        p.slug !== build.value!.slug &&
        (p.category === build.value!.category ||
          p.theme === build.value!.theme ||
          p.buildType === build.value!.buildType)
    )
    .slice(0, 4);
});
</script>
