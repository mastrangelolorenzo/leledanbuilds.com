export default defineNuxtRouteMiddleware(async (to) => {
  const isAppRoute = to.path === '/app' || to.path.startsWith('/app/')
  const isPublicAppRoute = to.path === '/app/login' || to.path === '/app/register'
  const isAdminRoute = to.path.startsWith('/app/posts')

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
})
