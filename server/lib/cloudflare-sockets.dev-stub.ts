// Dev-only stub for the `cloudflare:sockets` built-in module.
//
// `cloudflare:sockets` only exists inside the real Cloudflare Workers runtime
// (`workerd`), which is what `npm run build && npx wrangler dev` actually
// runs. `npm run dev` (Nuxt/Nitro's dev preset, via `nitro-cloudflare-dev`)
// runs on plain Node instead, and — unlike the production build, which
// code-splits each route into its own chunk — Nitro's dev preset bundles the
// *entire* server into one shared module graph. That means a single
// unresolvable `import ... from 'cloudflare:sockets'` anywhere in `server/`
// (e.g. server/lib/smtp.ts) breaks every route dispatched through that dev
// bundle, not just the SMTP-dependent ones.
//
// This stub is aliased in nuxt.config.ts's Nitro config, but ONLY when
// `nitroConfig.dev` is true (i.e. only for `npm run dev`), so:
//   - `npm run dev`: this stub resolves the import, so unrelated routes work
//     again. Calling `connect()` throws a clear, actionable error instead of
//     a cryptic bundler/ESM-loader failure.
//   - `npm run build` (the `cloudflare-module` preset): this alias is NOT
//     applied, so the real `cloudflare:sockets` (available at runtime via
//     workerd) is used, exactly as before.
//
// This is intentionally a separate file from test/stubs/cloudflare-sockets.ts
// (the Vitest stub) — different tool, different config surface (vitest.config.ts
// vs. nuxt.config.ts's Nitro alias) — even though the pattern is nearly identical.
export function connect(): never {
  throw new Error(
    'cloudflare:sockets is not available under nitro-cloudflare-dev — use "npm run build && npx wrangler dev" to test SMTP-dependent routes locally.'
  )
}
