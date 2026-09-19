export function getSessionSecret(event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never) {
  const secret = event.context.cloudflare?.env?.SESSION_SECRET
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'SESSION_SECRET is not configured' })
  }
  return secret as string
}

export function getPublicOrigin(event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never): string {
  const configured = event.context.cloudflare?.env?.PUBLIC_ORIGIN
  return configured ? configured.replace(/\/+$/, '') : getRequestURL(event).origin
}
