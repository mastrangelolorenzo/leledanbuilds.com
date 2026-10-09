<template>
  <section
    class="min-h-screen flex flex-col justify-end bg-background relative overflow-hidden"
  >
    <transition-group
      name="bg-fade"
      tag="div"
      class="absolute inset-0 w-full h-full pointer-events-none"
    >
      <img
        v-for="(img, i) in [currentBg, nextBg].filter(Boolean)"
        :key="imgKey(i)"
        :src="img"
        alt="Sfondo breathing"
        class="home-bg-breathing bg-fade-img absolute inset-0 w-full h-full object-cover z-0 brightness-100"
        :class="['animate-breath']"
        draggable="false"
      />
    </transition-group>

    <!-- Legibility gradient, bottom-left weighted like the reference layout -->
    <div class="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
    <div class="absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-transparent to-transparent pointer-events-none"></div>

    <div class="relative z-20 flex-1 w-full px-6 md:px-14 flex flex-col items-center justify-center text-center">
      <span class="flex items-center gap-3 text-foreground/70 text-sm md:text-base uppercase tracking-[0.25em] font-semibold mb-5">
        <span class="w-9 h-px bg-secondary"></span>
        Hand-crafted Minecraft builds
        <span class="w-9 h-px bg-secondary"></span>
      </span>

      <h1
        class="text-foreground drop-shadow-lg text-center text-4xl md:text-7xl font-black uppercase tracking-tight leading-[1.15]"
      >
        <span class="block whitespace-nowrap">Shaping a new world,</span>
        <span class="block whitespace-nowrap text-secondary">block by block!</span>
      </h1>

      <NuxtLink
        to="/browse"
        class="inline-flex items-center gap-4 text-base font-bold uppercase tracking-wide bg-primary text-black rounded-full pl-8 pr-3 py-3 shadow-lg shadow-primary/20 hover:bg-secondary transform hover:scale-105 transition-all duration-300 mt-8"
      >
        <span>Browse builds</span>
        <span class="flex items-center justify-center w-11 h-11 rounded-full bg-black/20">
          <UIcon name="i-lucide-arrow-right" class="text-lg" />
        </span>
      </NuxtLink>

    </div>

    <div class="relative z-20 w-full pb-10 md:pb-14 flex flex-col items-center gap-5">
      <span class="text-foreground/60 text-xl md:text-2xl uppercase tracking-widest font-bold">Work seen on</span>
      <p v-if="!workSeenOn?.length" class="text-foreground/50 text-center py-4">
        Creators are temporarily unavailable — check back soon.
      </p>
      <UMarquee v-else :overlay="false" :pauseOnHover="true" class="w-full py-2">
        <a
          v-for="creator in workSeenOn ?? []"
          :key="creator.id"
          :href="creator.link"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-4 mx-5 hover:-translate-y-0.5 transition-all duration-300"
        >
          <img :src="creator.image_url" :alt="creator.name" class="w-20 h-20 rounded-full object-cover border-2 border-secondary/70 shrink-0" />
          <span class="flex flex-col leading-tight whitespace-nowrap">
            <span class="text-foreground text-2xl font-bold">{{ creator.name }}</span>
            <span class="text-foreground/50 text-base">{{ creator.counter }}</span>
          </span>
        </a>
      </UMarquee>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

interface Creator {
  id: number
  name: string
  image_url: string
  counter: string
  link: string
}
const { data: workSeenOn } = await useFetch<Creator[]>('/api/work-seen-on');

const bgImages = [
  "/background/1.webp",
  "/background/2.webp",
  "/background/3.webp",
  "/background/4.webp",
  // "/background/5.webp",
];

const currentBgIndex = ref(0);
const nextBgIndex = ref<number | null>(null);
const isCrossfading = ref(false);
let intervalId: number | null = null;
let crossfadeTimeout: number | null = null;

const currentBg = computed(() => bgImages[currentBgIndex.value]);
const nextBg = computed(() =>
  nextBgIndex.value !== null ? bgImages[nextBgIndex.value] : undefined,
);

function imgKey(i: number) {
  if (i === 0) return `bg-${currentBgIndex.value}`;
  if (i === 1 && nextBgIndex.value !== null) return `bg-${nextBgIndex.value}`;
  return `bg-${i}`;
}

function startLoop() {
  intervalId = window.setInterval(() => {
    isCrossfading.value = true;
    nextBgIndex.value = (currentBgIndex.value + 1) % bgImages.length;

    crossfadeTimeout = window.setTimeout(() => {
      currentBgIndex.value = nextBgIndex.value as number;
      nextBgIndex.value = null;
      isCrossfading.value = false;
    }, 1500);
  }, 4500);
}

onMounted(() => {
  startLoop();
});
onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
  if (crossfadeTimeout) clearTimeout(crossfadeTimeout);
});
</script>

<style>
.home-bg-breathing {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 0;
}
.bg-fade-img {
  opacity: 1;
  transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.bg-fade-leave-active {
  transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}
.bg-fade-leave-to {
  opacity: 0;
}
.bg-fade-enter-active {
  transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}
.bg-fade-enter-from {
  opacity: 0;
}
.bg-fade-enter-to,
.bg-fade-leave-from {
  opacity: 1;
}

@keyframes breath {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}
.animate-breath {
  animation: breath 3s ease-in-out infinite;
}
</style>
