<template>
  <section id="about" class="relative bg-background/90 py-10 px-6 md:py-20">
    <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
      <!-- Avatar section, visually prioritized on desktop -->
      <div class="md:col-span-2 flex justify-center md:justify-end">
        <div class="relative group" style="perspective: 1000px;">
          <div
            ref="tiltCard"
            class="relative transition-transform duration-150 ease-out will-change-transform"
            :style="tiltStyle"
            @mousemove="onTiltMove"
            @mouseleave="onTiltLeave"
          >
            <img
              src="/images/profile_picture.webp"
              alt="Minecraft avatar"
              class="w-48 h-48 md:w-72 md:h-72 object-cover rounded-lg shadow-2xl shadow-primary/30 bg-background"
            />
          </div>
          <!-- Fancy ring effect behind avatar -->
          <span class="absolute inset-0 rounded-lg ring-4 ring-primary/30 animate-pulse -z-10"></span>
          <!-- Decorative blurred accent squares -->
          <span class="pointer-events-none absolute -left-5 -top-5 w-14 h-14 bg-secondary/10 backdrop-blur-[2px] rounded-lg border border-secondary/40"></span>
          <span class="pointer-events-none absolute -right-5 -bottom-5 w-20 h-20 bg-secondary/10 backdrop-blur-[2px] rounded-lg border border-secondary/40"></span>
        </div>
      </div>
      <!-- Bio text section -->
      <div class="md:col-span-3 flex flex-col items-start">
        <h1 class="text-3xl md:text-4xl font-extrabold tracking-wide mb-4">
          About <span class="gold-glow">leledan06</span>
        </h1>
        <div class="space-y-2 text-text text-lg leading-relaxed tracking-wide">
          <p>
            <span class="font-semibold text-primary">Heyla!</span> I'm lele, a professional Minecraft builder specialized in
            <span class="text-primary font-semibold">organic creations</span>,
            <span class="text-primary font-semibold">advanced terraforming</span>
            and <span class="text-primary font-semibold">epic structures</span>.
          </p>
          <p>
            With years of experience, I create immersive worlds that blend
            <span class="text-primary font-semibold">natural realism</span>
            with <span class="text-primary font-semibold">architectural design</span>.
            On my
            <a href="https://www.youtube.com/@leledan06" target="_blank" rel="noopener" class="underline decoration-primary hover:text-primary font-semibold transition-colors">YouTube channel</a>
            I share both detailed building videos and engaging adventures, bringing the community into my creative process.
          </p>
          <p>From ideas to <span class="text-primary font-bold">Professional Sculptures</span>.</p>
          <p>
            <span class="font-semibold">My mission</span> is to inspire and help others specialize in this field, showing the endless creative possibilities of Minecraft.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const tiltCard = ref<HTMLElement | null>(null);
const tiltStyle = ref("transform: rotateX(0deg) rotateY(0deg) scale(1);");

function onTiltMove(e: MouseEvent) {
  const el = tiltCard.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const rotateY = (x - 0.5) * 20;
  const rotateX = (0.5 - y) * 20;
  tiltStyle.value = `transform: rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05);`;
}

function onTiltLeave() {
  tiltStyle.value = "transform: rotateX(0deg) rotateY(0deg) scale(1);";
}
</script>