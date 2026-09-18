export interface AuthUser {
  userId: number
  role: 'admin' | 'user'
}

export function useAuthUser() {
  return useState<AuthUser | null>('auth-user', () => null)
}
