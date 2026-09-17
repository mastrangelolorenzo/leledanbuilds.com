<template>
  <section class="bg-background py-14 md:py-20 px-4">
    <div class="max-w-6xl mx-auto flex flex-col items-center">
      <h2 class="text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-center gold-glow">
        Premium Projects
      </h2>
      <p class="text-text/70 text-center max-w-xl mt-3 mb-10">
        My most detailed and ambitious builds, crafted for competitions, collaborations and large-scale visions.
      </p>

      <p v-if="!projects?.length" class="text-text/50 text-center py-8">
        Projects are temporarily unavailable — check back soon.
      </p>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
        <button
          v-for="project in projects ?? []"
          :key="project.id"
          class="group relative text-left rounded-2xl overflow-hidden border-2 border-primary/40 hover:border-primary transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="openProject = project"
        >
          <img
            :src="project.image_url"
            :alt="project.title"
            class="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
            draggable="false"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-3">
            <h3 class="text-white font-bold uppercase text-sm tracking-wide">{{ project.title }}</h3>
            <span class="text-secondary text-xs font-semibold inline-flex items-center gap-1">
              View Project <UIcon name="i-lucide-arrow-right" class="text-xs" />
            </span>
          </div>
        </button>
      </div>

      <NuxtLink
        to="/portfolio"
        class="inline-flex items-center gap-2 mt-10 text-base font-bold uppercase bg-transparent border-2 border-primary text-primary rounded-xl px-6 py-3 hover:bg-primary hover:text-black transition-all duration-300"
      >
        View Full Portfolio
        <UIcon name="i-lucide-arrow-right" class="text-lg" />
      </NuxtLink>
    </div>

    <!-- Project detail popup -->
    <div
      v-if="openProject"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      @click.self="openProject = null"
    >
      <div class="bg-background-secondary border-2 border-primary rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in">
        <img :src="openProject.image_url" :alt="openProject.title" class="w-full max-h-[50vh] object-cover" />
        <div class="p-6">
          <h3 class="text-secondary font-extrabold text-2xl uppercase mb-2">{{ openProject.title }}</h3>
          <p class="text-text leading-relaxed whitespace-pre-line">{{ openProject.description }}</p>
        </div>
        <button
          class="absolute top-4 right-6 text-white text-3xl font-extrabold bg-black/40 hover:bg-black/70 rounded-full px-3 py-0 transition"
          @click="openProject = null"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref } from "vue";

interface Project {
  id: number
  title: string
  slug: string
  image_url: string
  teaser: string
  description: string
}

const { data: projects, error } = await useFetch<Project[]>('/api/posts/home')

const openProject = ref<Project | null>(null);
</script>

<style>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.25s ease-out;
}
</style>
