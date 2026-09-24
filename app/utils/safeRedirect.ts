// Same-origin relative paths only. A bare startsWith('/') is not enough:
// "//evil.com" also starts with "/" but browsers resolve it as
// protocol-relative -- i.e. an absolute URL on an attacker-controlled host,
// using whatever protocol the current page loaded with -- so it must be
// rejected explicitly. "https://evil.com" / "http://evil.com" (and any other
// absolute URL) are already rejected by startsWith('/'). "/\evil.com" and
// "\\evil.com" are rejected too, since some browsers normalize a leading
// backslash to a second slash, producing the same protocol-relative bypass.
//
// Pure and framework-free on purpose: it's a security guard, not a Nuxt
// composable, so it can be unit-tested directly (see safeRedirect.test.ts)
// without bootstrapping Nuxt's runtime.
export function isSafeRedirect(value: unknown): value is string {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.startsWith('/\\')
}
