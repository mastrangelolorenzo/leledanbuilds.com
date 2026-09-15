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
          class="relative rounded-2xl overflow-hidden border-2 border-primary/40 hover:border-primary transition-all duration-300 bg-background-secondary aspect-[4/3]"
        >
          <img
            :src="reason.image"
            :alt="reason.title"
            class="absolute inset-0 w-full h-full object-contain object-bottom scale-125 origin-bottom"
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
    description: "Each build is crafted with meticulous attention to detail, combining technical expertise with artistic vision to deliver truly premium results.",
  },
  {
    image: "/images/why-choose-2.webp",
    title: "Innovation",
    description: "Constantly pushing the limits of what's possible in Minecraft, exploring new techniques and creative solutions that redefine what building can be.",
  },
  {
    image: "/images/why-choose-1.webp",
    title: "Efficiency",
    description: "Years of experience, mastery of tools, and a vast library of assets ensure fast, reliable delivery, without ever compromising on quality.",
  },
];
</script>

<style>
.gold-glow {
  background: linear-gradient(90deg, #fff6d6, #f4d03f, #d4af37, #f4d03f, #fff6d6);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 20px rgba(244, 208, 63, 0.55), 0 0 40px rgba(212, 175, 55, 0.35);
  animation: gold-shine 4s linear infinite;
}
@keyframes gold-shine {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}
</style>
