import { http } from '@/lib/http'
import type { LoginRequest, LoginResponse, LogoutResponse, MeResponse } from '@/types/auth'

export const authApi = {
  login: (body: LoginRequest) => http.post<LoginResponse>('/auth/login', body),
  me: () => http.get<MeResponse>('/auth/me'),
  logout: () => http.post<LogoutResponse>('/auth/logout'),
}

export const meQueryKey = ['auth', 'me'] as const
