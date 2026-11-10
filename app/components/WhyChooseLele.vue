<template>
  <section class="bg-background py-14 md:py-20 px-4">
    <div class="max-w-6xl mx-auto flex flex-col items-center">
      <h2 class="text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-center gold-glow mb-10">
        Why Choose Lele
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <div
          v-for="reason in reasons"
          :key="reason.title"
          class="group relative rounded-2xl overflow-hidden border-2 border-primary/40 hover:border-primary transition-all duration-300 bg-background-secondary aspect-[4/3]"
        >
          <img
            :src="reason.image"
            :alt="reason.title"
            class="absolute inset-0 w-full h-full object-contain object-bottom scale-125 origin-bottom transition-transform duration-500 group-hover:scale-150"
            draggable="false"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-5">
            <h3 class="text-secondary font-extrabold uppercase text-lg tracking-wide mb-2">{{ reason.title }}</h3>
            <p class="text-white/80 text-sm leading-relaxed">{{ reason.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const reasons = [
  {
    image: "/images/why-choose-3.webp",
    title: "Craftmanship",
    description: "Each project is developed with maximum dedication and stylistic care. I focus on clean texturing, unique shading, and sharp details to give every asset a premium look.",
  },
  {
    image: "/images/why-choose-2.webp",
    title: "Innovation",
    description: "Breaking the limits of standard styling. I constantly explore original concepts, fresh color palettes, and unique themes that make your characters and worlds stand out from the crowd.",
  },
  {
    image: "/images/why-choose-1.webp",
    title: "Efficiency",
    description: "Quality meets reliability. Thanks to a structured workflow and a solid asset library, I ensure fast updates, optimized files, and ready-to-use content without ever dropping the standard.",
  },
];
</script>
