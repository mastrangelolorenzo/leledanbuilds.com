<template>
  <section class="relative bg-background py-14 px-4 overflow-hidden">
    <!-- Decorative gold glow behind the figures, matching the about-page stats. -->
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div class="h-16 md:h-20 w-[min(30rem,62%)] rounded-full bg-primary/10 blur-2xl"></div>
    </div>
    <div class="relative max-w-5xl mx-auto flex flex-col items-center text-center">
      <h2 class="text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-text mb-8">
        By The Numbers
      </h2>
      <div ref="statsRef" class="flex flex-wrap justify-center items-center gap-x-16 gap-y-6">
        <div class="flex flex-col items-center">
          <span class="text-4xl md:text-5xl font-extrabold text-primary drop-shadow-[0_0_25px_rgba(212,175,55,0.45)]">{{ count }}M+</span>
          <span class="text-text/60 text-sm uppercase tracking-widest font-semibold">Combined Subscribers</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-4xl md:text-5xl font-extrabold text-primary drop-shadow-[0_0_25px_rgba(212,175,55,0.45)]">{{ count }}M+</span>
          <span class="text-text/60 text-sm uppercase tracking-widest font-semibold">Views Across All Platforms</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const statsRef = ref<HTMLElement | null>(null);
const count = ref(0);
const target = 10;
const duration = 1500;
let observer: IntersectionObserver | null = null;
let rafId: number | null = null;

function animateCount() {
  const start = performance.now();
  function tick(now: number) {
    const progress = Math.min((now - start) / duration, 1);
    count.value = Math.round(progress * target);
    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    }
  }
  rafId = requestAnimationFrame(tick);
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount();
          observer?.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  if (statsRef.value) observer.observe(statsRef.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (rafId) cancelAnimationFrame(rafId);
});
</script>
