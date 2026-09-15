<template>
  <section class="relative py-10 px-4 overflow-x-auto">
    <div class="absolute inset-0 grid-bg pointer-events-none"></div>
    <div class="relative max-w-4xl mx-auto rounded-3xl bg-background-secondary/50 shadow-xl px-4 md:px-12 py-6 md:py-10 w-fit min-w-full sm:min-w-0">
      <div class="flex flex-nowrap justify-center items-center">
        <template v-for="(stat, index) in stats" :key="stat.label">
          <div
            class="flex flex-col items-center gap-1 md:gap-2 px-3 sm:px-6 md:px-10 shrink-0"
            :class="index > 0 ? 'border-l border-white/10' : ''"
          >
            <span class="stat-number text-2xl sm:text-4xl md:text-5xl font-black whitespace-nowrap">{{ stat.value }}</span>
            <span class="text-text/50 text-[9px] sm:text-[11px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-bold whitespace-nowrap">{{ stat.label }}</span>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const stats = [
  { value: "50+", label: "Happy Clients" },
  { value: "150+", label: "Creations" },
  { value: "6+", label: "Years Of Experience" },
];
</script>

<style>
.stat-number {
  background: linear-gradient(180deg, #ffffff 0%, #d9d9d9 45%, #8a8a8a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
