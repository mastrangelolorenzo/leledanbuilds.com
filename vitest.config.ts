import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      // `cloudflare:sockets` only exists in the Cloudflare Workers runtime.
      // Alias it to a stub so files that import it (e.g. server/utils/smtp.ts)
      // can still be loaded in plain Node under Vitest. See test/stubs/cloudflare-sockets.ts.
      'cloudflare:sockets': fileURLToPath(new URL('./test/stubs/cloudflare-sockets.ts', import.meta.url)),
    },
  },
})
