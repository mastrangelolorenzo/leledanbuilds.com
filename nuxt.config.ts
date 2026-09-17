// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";


export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', 'nitro-cloudflare-dev'],
  css: ['~/assets/css/main.css'],
  nitro: {
    preset: 'cloudflare_pages',
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})