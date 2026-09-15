<template>
  <nav class="flex items-center justify-center py-3 px-4 sm:py-4 sm:px-8">
    <div class="flex items-center w-full max-w-5xl rounded-full bg-background-secondary/60 px-6 sm:px-9 py-3.5">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
        <img src="/images/logo.png" alt="leledan06 logo" class="h-8 w-auto object-contain" />
        <span class="hidden sm:block text-primary font-extrabold tracking-wide uppercase text-sm">leledan06</span>
      </NuxtLink>

      <!-- Hamburger button for mobile -->
      <button
        class="ml-auto sm:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        @click="mobileOpen = !mobileOpen"
        aria-label="Open navigation menu"
      >
        <UIcon :name="mobileOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="w-7 h-7 text-primary" />
      </button>

      <!-- Desktop menu -->
      <div class="flex-1 min-w-0 gap-6 flex justify-center sm:flex hidden pl-8 sm:pl-12 pr-8 sm:pr-12">
        <!-- About dropdown -->
        <div class="group relative flex items-center">
          <button
            type="button"
            class="text-text font-semibold uppercase text-sm tracking-wide hover:text-primary transition-all flex items-center gap-1.5 px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <UIcon name="i-lucide-user" class="text-primary text-base" />
            <span>About</span>
            <UIcon name="i-lucide-chevron-down" class="text-xs transition-transform duration-300 group-hover:rotate-180" />
          </button>
          <div
            class="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:flex group-focus-within:flex flex-col w-max z-30"
          >
            <div class="flex flex-col bg-background-secondary border border-primary/20 rounded-lg overflow-hidden shadow-xl">
              <NuxtLink
                to="/about"
                class="px-5 py-3 text-sm text-text hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
              >
                About leledan06
              </NuxtLink>
              <NuxtLink
                to="/portfolio"
                class="px-5 py-3 text-sm text-text hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
              >
                Builds Portfolio
              </NuxtLink>
            </div>
          </div>
        </div>

        <NuxtLink
          v-for="item in items"
          :key="item.label"
          :to="item.to"
          class="group relative text-text font-semibold uppercase text-sm tracking-wide hover:text-primary transition-all flex items-center gap-1.5 px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <UIcon :name="item.icon" class="text-primary text-base" />
          <span class="relative">
            {{ item.label }}
            <span
              class="pointer-events-none absolute left-0 -bottom-[0.2em] w-full h-[2px] bg-secondary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"
            ></span>
          </span>
        </NuxtLink>
      </div>

      <!-- Commission CTA -->
      <a
        href="https://discord.gg/u9FyUqa6uz"
        target="_blank"
        rel="noopener noreferrer"
        class="hidden sm:inline-flex shrink-0 items-center gap-2 bg-primary text-black font-bold uppercase text-sm rounded-full px-5 py-2 hover:bg-secondary transition-all duration-300 hover:scale-105"
      >
        Commission
        <UIcon name="i-lucide-arrow-right" class="text-base" />
      </a>
    </div>

    <!-- Mobile overlay menu -->
    <transition name="fade">
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-20 bg-black/70 flex flex-col"
        @click.self="mobileOpen = false"
      >
        <nav
          class="bg-background p-6 h-full w-4/5 max-w-xs shadow-xl flex flex-col gap-3"
          role="menu"
          aria-label="Main navigation"
        >
          <button
            class="self-end mb-3 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            @click="mobileOpen = false"
            aria-label="Close menu"
          >
            <UIcon name="i-lucide-x" class="w-8 h-8 text-primary" />
          </button>
          <div class="flex flex-col gap-1 pb-2 border-b border-primary/10">
            <span class="text-primary/70 text-xs uppercase tracking-widest font-bold px-2 mb-1">About</span>
            <NuxtLink
              to="/about"
              class="w-full text-lg text-text font-bold py-2 px-2 rounded hover:bg-primary/10 hover:text-primary transition"
              @click="mobileOpen = false"
            >
              About leledan06
            </NuxtLink>
            <NuxtLink
              to="/portfolio"
              class="w-full text-lg text-text font-bold py-2 px-2 rounded hover:bg-primary/10 hover:text-primary transition"
              @click="mobileOpen = false"
            >
              Builds Portfolio
            </NuxtLink>
          </div>
          <div
            v-for="item in items"
            :key="item.label"
            class="flex items-center gap-2"
            role="menuitem"
          >
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 w-full text-lg text-text font-bold py-2 px-2 rounded hover:bg-primary/10 hover:text-primary transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              @click="mobileOpen = false"
              tabindex="0"
            >
              <UIcon :name="item.icon" class="text-primary" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </div>
          <a
            href="https://discord.gg/u9FyUqa6uz"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-4 inline-flex items-center justify-center gap-2 bg-primary text-black font-bold uppercase text-sm rounded-full px-5 py-3 hover:bg-secondary transition-all duration-300"
            @click="mobileOpen = false"
          >
            Commission
            <UIcon name="i-lucide-arrow-right" class="text-base" />
          </a>
        </nav>
      </div>
    </transition>
  </nav>
</template>



<script lang="ts" setup>
  const mobileOpen = ref(false);
  const items = ref([
    {
      label: 'Browse',
      to: '/portfolio',
      icon: 'i-lucide-image',
    },
    {
      label: 'Pricing',
      to: '/services',
      icon: 'i-lucide-hammer',
    }
  ]);

</script>

<style>

</style>
