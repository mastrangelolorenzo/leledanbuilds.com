export default defineEventHandler((event) => {
  deleteCookie(event, 'session', { path: '/' })
  return { success: true }
})
