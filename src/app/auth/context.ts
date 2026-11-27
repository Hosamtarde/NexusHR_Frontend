import { createContext, useContext } from 'react'
import type { ApiError } from '@/lib/http'
import type { AppRole, ChatSession, LoginRequest, MeResponse } from '@/types/auth'

export type AuthStatus = 'anonymous' | 'loading' | 'authenticated' | 'error'

export interface AuthContextValue {
  status: AuthStatus
  user: MeResponse | null
  role: AppRole | null
  chat: ChatSession | null
  error: ApiError | null
  login: (body: LoginRequest) => Promise<MeResponse>
  logout: () => Promise<void>
  retry: () => void
  can: (path: string) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
