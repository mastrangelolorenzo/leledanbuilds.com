<template>
  <footer class="bg-background pt-12 pb-6 px-4">
    <div class="max-w-6xl mx-auto flex flex-col gap-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <!-- Brand -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <img src="/images/logo.png" alt="leledan06 logo" class="h-8 w-auto object-contain" />
            <span class="text-primary font-extrabold uppercase tracking-wide">leledan06</span>
          </div>
          <p class="text-text/80 text-sm italic">Premium quality from Italy to the world.</p>
          <div class="flex items-center gap-3 text-primary py-2">
            <a
              v-for="link in socialLinks"
              :key="link.url"
              :href="link.url"
              target="_blank"
              class="flex items-center justify-center duration-300 group hover:scale-105 transition-all"
            >
              <span class="relative flex items-center justify-center">
                <svg
                  class="absolute inset-0 w-10 h-10 pointer-events-none blur-xl z-0 color-secondary"
                >
                  <use href="/resources/glow_shape.svg" />
                </svg>
                <UIcon
                  :name="link.icon"
                  size="24"
                  class="relative z-10 group-hover:text-secondary transition-colors duration-300"
                />
              </span>
            </a>
          </div>
        </div>

        <!-- Pages -->
        <div class="flex flex-col gap-2">
          <h3 class="text-primary font-bold uppercase text-sm tracking-wide flex items-center gap-2 mb-1">
            <UIcon name="i-lucide-layout-grid" />
            Pages
          </h3>
          <NuxtLink to="/" class="text-text/80 hover:text-primary transition-colors text-sm">Home</NuxtLink>
          <NuxtLink to="/about" class="text-text/80 hover:text-primary transition-colors text-sm">About</NuxtLink>
          <NuxtLink to="/portfolio" class="text-text/80 hover:text-primary transition-colors text-sm">Builds</NuxtLink>
          <NuxtLink to="/contact" class="text-text/80 hover:text-primary transition-colors text-sm">Contact</NuxtLink>
        </div>

        <!-- Legal -->
        <div class="flex flex-col gap-2 md:border-l md:border-primary/30 md:pl-8">
          <h3 class="text-primary font-bold uppercase text-sm tracking-wide flex items-center gap-2 mb-1">
            <UIcon name="i-lucide-scale" />
            Legal
          </h3>
          <NuxtLink to="/tos" class="text-text/80 hover:text-primary transition-colors text-sm">Terms of Service</NuxtLink>
          <NuxtLink to="/refunds" class="text-text/80 hover:text-primary transition-colors text-sm">Refunds</NuxtLink>
          <NuxtLink to="/privacy" class="text-text/80 hover:text-primary transition-colors text-sm">Privacy Policy</NuxtLink>
        </div>

        <!-- Contact -->
        <div class="flex flex-col gap-2 md:border-l md:border-primary/30 md:pl-8">
          <h3 class="text-primary font-bold uppercase text-sm tracking-wide flex items-center gap-2 mb-1">
            <UIcon name="i-lucide-mail" />
            Contact
          </h3>
          <a href="mailto:leledanbusiness@gmail.com" class="text-text/80 hover:text-primary transition-colors text-sm">
            leledanbusiness@gmail.com
            <span class="block text-text/50 text-xs">For business inquiries</span>
          </a>
          <span class="text-text/80 text-sm">
            @leledan06
            <span class="block text-text/50 text-xs">Discord handle</span>
          </span>
        </div>
      </div>

      <div class="border-t border-primary/20 pt-5 flex flex-col items-center gap-1">
        <div class="flex flex-col items-center gap-2 mb-3">
          <span class="text-text/50 text-[11px] uppercase tracking-[0.2em] font-bold">We accept</span>
          <ul class="flex flex-wrap items-center justify-center gap-2.5">
            <li v-for="method in paymentMethods" :key="method.name" class="flex items-center">
              <span
                class="flex items-center justify-center h-8 w-12 rounded-md shadow-sm transition-transform duration-200 hover:scale-105"
                :class="[method.chip, method.color]"
              >
                <UIcon :name="method.icon" class="text-2xl" :aria-label="method.name" role="img" />
              </span>
            </li>
          </ul>
        </div>

        <p class="text-text/80 text-sm">Copyright © {{ new Date().getFullYear() }} leledan06 - All rights reserved.</p>
        <p class="text-text/60 italic text-sm">Shaping new realities, one block at a time.</p>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
  // Card brands are handled by Stripe Checkout; Klarna is enabled on the
  // account too. PayPal is listed because the integration ships with the
  // site — it only goes live once its credentials are configured.
  //
  // Each mark gets its official brand colour, on a chip rather than directly
  // on the footer: Visa (#1A1F71) and PayPal (#003087) are near-black navy,
  // so on this dark background they would be all but invisible. A light chip
  // is also how these badges appear in the wild, so it reads as intended
  // rather than as a workaround.
  //
  // Klarna is the exception that proves the rule — its badge is black on its
  // own pink (#FFB3C7), and pink-on-white would be illegible — hence the
  // per-method chip colour instead of one shared white.
  //
  // Colours are Tailwind arbitrary values rather than inline styles so they
  // go through the normal class pipeline; they are source literals, never
  // user input.
  const paymentMethods = [
    { name: 'Visa', icon: 'i-simple-icons-visa', chip: 'bg-white', color: 'text-[#1A1F71]' },
    { name: 'Mastercard', icon: 'i-simple-icons-mastercard', chip: 'bg-white', color: 'text-[#EB001B]' },
    { name: 'American Express', icon: 'i-simple-icons-americanexpress', chip: 'bg-white', color: 'text-[#2E77BC]' },
    { name: 'PayPal', icon: 'i-simple-icons-paypal', chip: 'bg-white', color: 'text-[#003087]' },
    { name: 'Klarna', icon: 'i-simple-icons-klarna', chip: 'bg-[#FFB3C7]', color: 'text-black' },
  ]

  const socialLinks = [
    {
      icon: "i-simple-icons-discord",
      url: "https://discord.gg/u9FyUqa6uz",
    },
    {
      icon: "i-simple-icons-twitter",
      url: "https://twitter.com/leledan06",
    },
    {
      icon: "i-simple-icons-instagram",
      url: "https://www.instagram.com/leledan.builds/",
    },
    {
      icon: "i-simple-icons-youtube",
      url: "https://www.youtube.com/@leledan06",
    },
    {
      icon: "i-simple-icons-gmail",
      url: "mailto:leledanbusiness@gmail.com",
    },
    {
      icon: "i-simple-icons-telegram",
      url: "https://t.me/leledan06",
    },
    {
      icon: "i-simple-icons-tiktok",
      url: "https://www.tiktok.com/@leledan06",
    }
  ]
</script>
