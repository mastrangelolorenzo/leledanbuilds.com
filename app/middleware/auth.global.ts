export default defineNuxtRouteMiddleware(async (to) => {
  const isAppRoute = to.path === '/app' || to.path.startsWith('/app/')
  const isPublicAppRoute = to.path === '/app/login' || to.path === '/app/register'
  const isAdminRoute = ['/app/posts', '/app/work-seen-on', '/app/reviews', '/app/pricing', '/app/browse'].some(
    p => to.path === p || to.path.startsWith(`${p}/`)
  )

  if (!isAppRoute || isPublicAppRoute) return

  const user = useAuthUser()
  const { data: me } = await useFetch('/api/auth/me', { retry: false })
  user.value = me.value ?? null

  if (!me.value) {
    return navigateTo('/app/login')
  }

  if (isAdminRoute && me.value.role !== 'admin') {
    return navigateTo('/app')
  }

  // The dashboard home (/app) only has real content for admins (posts
  // stats). A non-admin landing there sees a dead "nothing here yet" page,
  // so send them straight to the one page that's actually theirs. This
  // can't loop: /app/purchases is neither `/app` itself nor in
  // isAdminRoute, so it passes straight through on the next navigation.
  if (to.path === '/app' && me.value.role !== 'admin') {
    return navigateTo('/app/purchases')
  }
})
