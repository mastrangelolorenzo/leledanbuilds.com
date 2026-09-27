// https://nuxt.com/docs/api/configuration/nuxt-config

import { fileURLToPath } from 'node:url'
import tailwindcss from "@tailwindcss/vite";


export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', 'nitro-cloudflare-dev'],
  css: ['~/assets/css/main.css'],
  nitro: {
    preset: 'cloudflare-module',
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  hooks: {
    // `npm run dev` runs Nitro's dev preset in plain Node, which bundles the
    // *entire* server into one shared module graph (unlike the production
    // build, which code-splits per route). `server/lib/smtp.ts` imports the
    // Workers-only `cloudflare:sockets` builtin, which is unresolvable under
    // Node — and because dev mode shares one bundle, that one unresolvable
    // import breaks every unrelated route too, not just SMTP-dependent ones.
    //
    // Fix: alias `cloudflare:sockets` to a local throwing stub, but ONLY when
    // `nitroConfig.dev` is true (i.e. only for `npm run dev`). The production
    // build (`cloudflare-module` preset, `npm run build`) must NOT get this
    // alias — it genuinely has `cloudflare:sockets` available via workerd.
    'nitro:config': (nitroConfig) => {
      if (nitroConfig.dev) {
        nitroConfig.alias ||= {}
        nitroConfig.alias['cloudflare:sockets'] = fileURLToPath(
          new URL('./server/lib/cloudflare-sockets.dev-stub.ts', import.meta.url)
        )
      }
    },
  },
})