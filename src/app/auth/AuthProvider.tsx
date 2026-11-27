import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toApiError } from '@/lib/http'
import { clearSession, getChatSession, hasSession, setSession, subscribeSession } from '@/lib/session'
import { isAppRole, type LoginRequest } from '@/types/auth'
import { canAccess } from '../access'
import { authApi, meQueryKey } from './api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const signedIn = useSyncExternalStore(subscribeSession, hasSession, hasSession)
  const chat = useSyncExternalStore(subscribeSession, getChatSession, getChatSession)
  const wasSignedIn = useRef(signedIn)

  const me = useQuery({
    queryKey: meQueryKey,
    queryFn: authApi.me,
    enabled: signedIn,
    staleTime: 5 * 60_000,
  })

  useEffect(() => {
    if (wasSignedIn.current && !signedIn) queryClient.clear()
    wasSignedIn.current = signedIn
  }, [signedIn, queryClient])

  const login = useCallback(
    async (body: LoginRequest) => {
      const data = await authApi.login(body)
      queryClient.clear()
      setSession(data, data.chat)
      return queryClient.fetchQuery({ queryKey: meQueryKey, queryFn: authApi.me })
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      clearSession()
    }
    clearSession()
    queryClient.clear()
  }, [queryClient])

  const retry = useCallback(() => {
    void me.refetch()
  }, [me])

  const user = signedIn ? (me.data ?? null) : null
  const status: AuthStatus = !signedIn ? 'anonymous' : user ? 'authenticated' : me.isError ? 'error' : 'loading'

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      role: user && isAppRole(user.role) ? user.role : null,
      chat: signedIn ? chat : null,
      error: me.error ? toApiError(me.error) : null,
      login,
      logout,
      retry,
      can: (path: string) => canAccess(user?.role, path),
    }),
    [status, user, signedIn, chat, me.error, login, logout, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
