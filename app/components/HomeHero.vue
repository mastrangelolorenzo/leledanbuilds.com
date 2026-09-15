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
      <span class="flex items-center gap-3 text-foreground/70 text-xs md:text-sm uppercase tracking-[0.25em] font-semibold mb-4">
        <span class="w-9 h-px bg-secondary"></span>
        Hand-crafted Minecraft builds
        <span class="w-9 h-px bg-secondary"></span>
      </span>

      <h1
        class="text-foreground drop-shadow-lg text-center text-3xl md:text-5xl font-black uppercase tracking-tight leading-[1.15]"
      >
        <span class="block whitespace-nowrap">Shaping a new world,</span>
        <span class="block whitespace-nowrap text-secondary">block by block!</span>
      </h1>

      <NuxtLink
        to="/portfolio"
        class="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-wide bg-primary text-black rounded-full pl-6 pr-2 py-2 shadow-lg shadow-primary/20 hover:bg-secondary transform hover:scale-105 transition-all duration-300 mt-7"
      >
        <span>Browse builds</span>
        <span class="flex items-center justify-center w-9 h-9 rounded-full bg-black/20">
          <UIcon name="i-lucide-arrow-right" class="text-base" />
        </span>
      </NuxtLink>

    </div>

    <div class="relative z-20 w-full pb-10 md:pb-14 flex flex-col items-center gap-4">
      <span class="text-foreground/60 text-base md:text-lg uppercase tracking-widest font-bold">Work seen on</span>
      <UMarquee :overlay="false" :pauseOnHover="true" class="w-full py-2">
        <a
          v-for="creator in workSeenOn"
          :key="creator.name"
          :href="creator.link"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-4 mx-5 hover:-translate-y-0.5 transition-all duration-300"
        >
          <img :src="creator.image" :alt="creator.name" class="w-16 h-16 rounded-full object-cover border-2 border-secondary/70 shrink-0" />
          <span class="flex flex-col leading-tight whitespace-nowrap">
            <span class="text-foreground text-xl font-bold">{{ creator.name }}</span>
            <span class="text-foreground/50 text-sm">{{ creator.counter }}</span>
          </span>
        </a>
      </UMarquee>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

const workSeenOn = [
  { image: "/customers/zenith.webp", name: "Zenith", counter: "300k subs", link: "https://www.youtube.com/@zenithminecraft" },
  { image: "/customers/divvy.webp", name: "Divvy", counter: "202k subs", link: "https://www.youtube.com/@divvyminecraft" },
  { image: "/customers/cypro.webp", name: "Cypro", counter: "41.3k subs", link: "https://www.youtube.com/@cyproh" },
  { image: "/customers/tigr8.webp", name: "Tigr8", counter: "148k subs", link: "https://www.youtube.com/@Tigr8" },
  { image: "/customers/lilygumdrop.webp", name: "LilyGumdrop", counter: "1.64M subs", link: "https://www.youtube.com/@Lilygumdrop-rb" },
  { image: "/customers/yeslucid.webp", name: "yeslucid", counter: "198k subs", link: "https://www.youtube.com/@yeslucid" },
  { image: "/customers/onmod.webp", name: "OnMod", counter: "18.2k subs", link: "https://www.youtube.com/@OnMod" },
  { image: "/customers/gabby16bit.webp", name: "Gabby16bit", counter: "3.5M subs", link: "https://www.youtube.com/@Gabby16bit" },
  { image: "/customers/sharkliz.webp", name: "sharkliz", counter: "400k+ subs", link: "https://www.youtube.com/@Sharkilz" },
  { image: "/customers/swizu.webp", name: "swizu", counter: "66k+ subs", link: "https://www.youtube.com/@swizu_" },
  { image: "/customers/mythicalpingu.webp", name: "mythicalpingu", counter: "35k+ subs", link: "https://www.youtube.com/channel/UCZPR2no7zsOlsgFWBYvPWVg" },
];

const bgImages = [
  "/background/1.webp",
  "/background/2.webp",
  "/background/3.webp",
  // "/background/4.webp",
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
