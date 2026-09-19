// Test-only stub for the `cloudflare:sockets` built-in module.
//
// `cloudflare:sockets` only exists inside the Cloudflare Workers runtime
// (and is normally polyfilled during `nuxt dev`/`nuxt build` by the
// `nitro-cloudflare-dev` module). Plain Vitest runs in Node and has no such
// module, so importing it at the top of `server/utils/smtp.ts` would make
// the whole file - including its pure, unit-testable helpers
// (`isValidEmailForHeader`, `buildMessage`) - fail to load.
//
// This stub is aliased in vitest.config.ts purely so that module resolution
// succeeds. `sendMail`, the only function that actually calls `connect`, is
// intentionally NOT unit-tested (it needs a live TCP socket and is verified
// by sending a real email in Task 3) - so this stub is never expected to be
// invoked. It throws if it ever is, so a future test that accidentally
// exercises `sendMail` fails loudly instead of hanging or lying.
export function connect(): never {
  throw new Error(
    'cloudflare:sockets is stubbed out in the Vitest environment; sendMail() cannot run under `vitest run`.'
  )
}
