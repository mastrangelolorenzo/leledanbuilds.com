<template>
  <section class="relative bg-background-secondary py-14 px-4 overflow-hidden">
    <div class="absolute inset-0 grid-bg pointer-events-none"></div>
    <div class="relative max-w-5xl mx-auto flex flex-col items-center text-center">
      <span class="flex items-center gap-2 text-secondary text-xs uppercase tracking-[0.25em] font-bold mb-4">
        <span class="w-2 h-2 rounded-full bg-secondary"></span>
        Built & Featured On
      </span>
      <div class="flex flex-col items-center mb-8">
        <span class="text-4xl md:text-5xl font-extrabold text-primary">8M+</span>
        <span class="text-text/60 text-sm uppercase tracking-widest font-semibold">Combined Subscribers</span>
      </div>
    </div>

    <UMarquee :overlay="false" :pauseOnHover="true" class="relative w-full py-2 mt-2">
      <a
        v-for="creator in creators"
        :key="creator.name"
        :href="creator.link"
        target="_blank"
        rel="noopener noreferrer"
        class="flex flex-col items-center gap-2 mx-5 hover:opacity-80 transition-opacity duration-300"
      >
        <img :src="creator.image" :alt="creator.name" class="w-12 h-12 rounded-full object-cover border border-white/20" />
        <span class="text-text/70 text-xs font-semibold whitespace-nowrap">{{ creator.name }}</span>
      </a>
    </UMarquee>
  </section>
</template>

<script lang="ts" setup>
const creators = [
  { image: "/customers/zenith.webp", name: "Zenith", link: "https://www.youtube.com/@zenithminecraft" },
  { image: "/customers/divvy.webp", name: "Divvy", link: "https://www.youtube.com/@divvyminecraft" },
  { image: "/customers/cypro.webp", name: "Cypro", link: "https://www.youtube.com/@cyproh" },
  { image: "/customers/tigr8.webp", name: "Tigr8", link: "https://www.youtube.com/@Tigr8" },
  { image: "/customers/lilygumdrop.webp", name: "LilyGumdrop", link: "https://www.youtube.com/@Lilygumdrop-rb" },
  { image: "/customers/yeslucid.webp", name: "yeslucid", link: "https://www.youtube.com/@yeslucid" },
  { image: "/customers/onmod.webp", name: "OnMod", link: "https://www.youtube.com/@OnMod" },
  { image: "/customers/gabby16bit.webp", name: "Gabby16bit", link: "https://www.youtube.com/@Gabby16bit" },
  { image: "/customers/sharkliz.webp", name: "sharkliz", link: "https://www.youtube.com/@Sharkilz" },
  { image: "/customers/swizu.webp", name: "swizu", link: "https://www.youtube.com/@swizu_" },
  { image: "/customers/mythicalpingu.webp", name: "mythicalpingu", link: "https://www.youtube.com/channel/UCZPR2no7zsOlsgFWBYvPWVg" },
];
</script>
