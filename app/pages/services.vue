<template>
  <div class="bg-background">
    <NavBar class="sticky top-0 z-10" />

    <div class="relative overflow-hidden py-14 md:py-20 px-6">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none"></div>
      <div class="relative max-w-6xl mx-auto flex flex-col items-center text-center">
        <span class="flex items-center gap-3 text-secondary text-xs md:text-sm uppercase tracking-[0.25em] font-bold mb-4">
          <span class="w-9 h-px bg-secondary"></span>
          Commission Rates
          <span class="w-9 h-px bg-secondary"></span>
        </span>
        <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tight text-text">
          Prices <span class="text-primary">(May Vary)</span>
        </h1>
        <p class="text-text/60 mt-3">Best Prices. Best Quality.</p>
      </div>

      <div class="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-7xl mx-auto mt-14">
        <div
          v-for="plan in plans"
          :key="plan.title"
          class="group relative bg-background-secondary rounded-3xl p-4 md:p-6 py-8 md:py-10 flex flex-col overflow-hidden transition-transform duration-300"
          :class="plan.badge
            ? 'border-2 border-primary shadow-[0_0_20px_rgba(212,175,55,0.2)] sm:-translate-y-2 hover:-translate-y-3'
            : 'border border-white/10 hover:-translate-y-1'"
        >
          <span class="shine-sweep absolute top-0 -left-[120%] w-1/2 h-full -skew-x-[20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"></span>

          <div v-if="plan.badge" class="absolute top-0 right-0 w-24 h-24 overflow-hidden">
            <span
              class="absolute top-[14px] -right-[38px] w-[150px] rotate-45 bg-primary text-black text-xs font-bold uppercase text-center py-1 tracking-wide"
            >
              {{ plan.badge }}
            </span>
          </div>

          <span class="flex items-center justify-center min-h-[2.25rem] text-text/50 text-xs uppercase tracking-[0.15em] font-bold text-center leading-tight">{{ plan.title }}</span>

          <span
            class="flex items-center justify-center min-h-[4.5rem] text-white font-black text-center my-5 drop-shadow-[0_0_25px_rgba(212,175,55,0.45)] whitespace-nowrap"
            :class="plan.price.length > 6 ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'"
          >
            {{ plan.price }}
          </span>
          <span class="flex items-center justify-center min-h-[1.5rem] text-white font-bold text-center text-base mb-5">{{ plan.subtitle }}</span>

          <div class="border-t border-white/10 mb-5"></div>

          <ul class="flex flex-col divide-y divide-white/10">
            <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2 text-text/80 text-base py-3">
              <span class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
              {{ feature }}
            </li>
          </ul>

          <div class="border-t border-white/10 mt-2"></div>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>
const plans = [
    {
      title: "Organics",
      price: "50€+",
      subtitle: "Per Build",
      features: [
        "High Quality",
        "Advanced Texturing",
        "2 Revision Rounds",
        "1 Week Max Delivery"
      ]
    },
    {
      title: "Structures",
      price: "70€+",
      subtitle: "Per Build",
      features: [
        "High Quality",
        "Advanced Details",
        "2 Revision Rounds",
        "1 Week Max Delivery"
      ]
    },
    {
      title: "Terraforming",
      price: "200€+",
      subtitle: "Per Build",
      features: [
        "High Quality",
        "Advanced Realism",
        "1 Revision Round",
        "2 Weeks Max Delivery"
      ]
    },
    {
      title: "Skin Creation",
      price: "20€+",
      subtitle: "Per Skin",
      features: [
        "High Quality",
        "Advanced Texturing",
        "2 Revision Rounds",
        "1 Week Max Delivery"
      ]
    },
    {
      title: "Custom Projects",
      price: "Upon Request",
      subtitle: "",
      badge: "Popular",
      features: [
        "Unique Projects",
        "Complete Servers",
        "Spawns & Lobbies",
        "Custom Timelines"
      ]
    }
]
</script>

<style>
@keyframes shine-sweep {
  from { left: -120%; }
  to { left: 140%; }
}
.group:hover .shine-sweep {
  animation: shine-sweep 0.8s ease-in-out;
}
</style>
