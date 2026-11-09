<template>
  <div class="bg-background">
    <NavBar class="sticky top-0 z-10 bg-background"/>

    <h1 class="text-3xl md:text-5xl font-bold text-primary tracking-wide mb-3 text-center uppercase my-10">Skinpacks</h1>

    <!-- The builds' portfolio treatment, on its own page: a skinpack is
         portfolio work, it is not sold here. -->
    <section class="max-w-6xl mx-auto px-4 pb-16">
      <p class="text-text/70 text-center max-w-2xl mx-auto mb-10">
        Character packs built to live alongside the builds.
      </p>

      <p v-if="!skinpacks?.length" class="text-text/50 text-center py-8">
        No skinpacks here yet — check back soon.
      </p>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          v-for="pack in skinpacks ?? []"
          :key="pack.id"
          class="group relative text-left cursor-pointer rounded-2xl overflow-hidden border-2 border-primary/40 hover:border-primary transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="openPack = pack"
        >
          <img
            :src="pack.image_url"
            :alt="pack.title"
            class="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
            draggable="false"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-5">
            <h3 class="text-white font-extrabold uppercase text-lg tracking-wide">{{ pack.title }}</h3>
            <p class="text-white/70 text-sm mt-1 line-clamp-2">{{ pack.description }}</p>
            <span class="text-secondary text-xs font-semibold uppercase inline-flex items-center gap-1 mt-2">
              View Pack <UIcon name="i-lucide-arrow-right" class="text-xs" />
            </span>
          </div>
        </button>
      </div>

      <div class="text-center mt-12">
        <NuxtLink
          to="/portfolio"
          class="inline-flex items-center gap-2 text-base font-bold uppercase bg-transparent border-2 border-primary text-primary rounded-xl px-6 py-3 hover:bg-primary hover:text-black transition-all duration-300"
        >
          See the Builds Portfolio
          <UIcon name="i-lucide-arrow-right" class="text-lg" />
        </NuxtLink>
      </div>
    </section>

    <div
      v-if="openPack"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      @click.self="openPack = null"
    >
      <div class="relative bg-background-secondary border-2 border-primary rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <img :src="openPack.image_url" :alt="openPack.title" class="w-full max-h-[45vh] object-cover" />
        <div class="p-6">
          <h3 class="text-secondary font-extrabold text-2xl uppercase mb-3">{{ openPack.title }}</h3>
          <p class="text-text leading-relaxed whitespace-pre-line">{{ openPack.description }}</p>
        </div>
        <button
          class="absolute top-4 right-6 text-white text-3xl font-extrabold bg-black/40 hover:bg-black/70 rounded-full px-3 py-0 transition"
          @click="openPack = null"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface Skinpack {
  id: number
  title: string
  image_url: string
  description: string
}

const { data: skinpacks } = await useFetch<Skinpack[]>('/api/browse-items/skinpacks')

const openPack = ref<Skinpack | null>(null)
</script>
