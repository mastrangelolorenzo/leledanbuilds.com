<template>
  <div class="bg-background">
    <NavBar class="sticky top-0 z-10 bg-background"/>

    <h1 class="text-3xl md:text-5xl font-bold text-primary tracking-wide mb-3 text-center uppercase my-10">Portfolio</h1>

    <!-- Signature Builds -->
    <section class="max-w-6xl mx-auto px-4 pb-16">
      <h2 class="text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-center mb-2 gold-glow">Signature Builds</h2>
      <p class="text-text/70 text-center max-w-2xl mx-auto mb-10">
        Detailed, competition-grade projects with a story behind every block.
      </p>

      <p v-if="!signatureBuilds?.length" class="text-text/50 text-center py-8">
        Signature builds are temporarily unavailable — check back soon.
      </p>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          v-for="build in signatureBuilds ?? []"
          :key="build.id"
          class="group relative text-left rounded-2xl overflow-hidden border-2 border-primary/40 hover:border-primary transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="openBuild = build"
        >
          <img
            :src="build.image_url"
            :alt="build.title"
            class="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
            draggable="false"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-5">
            <h3 class="text-white font-extrabold uppercase text-lg tracking-wide">{{ build.title }}</h3>
            <p class="text-white/70 text-sm mt-1 line-clamp-2">{{ build.teaser }}</p>
            <span class="text-secondary text-xs font-semibold uppercase inline-flex items-center gap-1 mt-2">
              View Project <UIcon name="i-lucide-arrow-right" class="text-xs" />
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- Signature build detail modal -->
    <div
      v-if="openBuild"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      @click.self="openBuild = null"
    >
      <div class="relative bg-background-secondary border-2 border-primary rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <img :src="openBuild.image_url" :alt="openBuild.title" class="w-full max-h-[45vh] object-cover" />
        <div class="p-6">
          <h3 class="text-secondary font-extrabold text-2xl uppercase mb-3">{{ openBuild.title }}</h3>
          <p class="text-text leading-relaxed whitespace-pre-line">{{ openBuild.description }}</p>
        </div>
        <button
          class="absolute top-4 right-6 text-white text-3xl font-extrabold bg-black/40 hover:bg-black/70 rounded-full px-3 py-0 transition"
          @click="openBuild = null"
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

interface Build {
  id: number
  title: string
  slug: string
  image_url: string
  teaser: string
  description: string
}

const { data: signatureBuilds, error } = await useFetch<Build[]>('/api/posts/portfolio')

const openBuild = ref<Build | null>(null)
</script>
