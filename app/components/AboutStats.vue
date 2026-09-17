<template>
  <section class="relative py-14 px-4 overflow-x-auto">
    <div ref="statsRef" class="relative max-w-4xl mx-auto rounded-3xl bg-background-secondary/50 shadow-xl px-4 md:px-12 py-6 md:py-10 w-fit min-w-full sm:min-w-0">
      <div class="flex flex-nowrap justify-center items-center">
        <template v-for="(stat, index) in stats" :key="stat.label">
          <div
            class="flex flex-col items-center gap-1 md:gap-2 px-3 sm:px-6 md:px-10 shrink-0"
            :class="index > 0 ? 'border-l border-white/10' : ''"
          >
            <span class="stat-number text-2xl sm:text-4xl md:text-5xl font-black whitespace-nowrap">{{ stat.count }}+</span>
            <span class="text-text/50 text-[9px] sm:text-[11px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-bold whitespace-nowrap">{{ stat.label }}</span>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";

const stats = reactive([
  { target: 50, count: 0, label: "Happy Clients" },
  { target: 150, count: 0, label: "Creations" },
  { target: 6, count: 0, label: "Years Of Experience" },
]);

const statsRef = ref<HTMLElement | null>(null);
const duration = 1500;
let observer: IntersectionObserver | null = null;
const rafIds: number[] = [];

function animateCount(stat: { target: number; count: number }) {
  const start = performance.now();
  function tick(now: number) {
    const progress = Math.min((now - start) / duration, 1);
    stat.count = Math.round(progress * stat.target);
    if (progress < 1) {
      rafIds.push(requestAnimationFrame(tick));
    }
  }
  rafIds.push(requestAnimationFrame(tick));
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          stats.forEach(animateCount);
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
  rafIds.forEach((id) => cancelAnimationFrame(id));
});
</script>

<style>
.stat-number {
  background: linear-gradient(180deg, #ffffff 0%, #d9d9d9 45%, #8a8a8a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
