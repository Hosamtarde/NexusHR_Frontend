export const ROLES = ['applicant', 'employee', 'manager', 'hr_admin'] as const
export type Role = (typeof ROLES)[number]

export const APP_ROLES = ['employee', 'manager', 'hr_admin'] as const satisfies readonly Role[]
export type AppRole = (typeof APP_ROLES)[number]

export const isRole = (value: unknown): value is Role => typeof value === 'string' && (ROLES as readonly string[]).includes(value)
export const isAppRole = (value: unknown): value is AppRole =>
  typeof value === 'string' && (APP_ROLES as readonly string[]).includes(value)

export interface Tokens {
  access_token: string
  refresh_token: string
}

export interface ChatSession {
  user_id: string
  auth_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginUser {
  user_id: number
  first_name: string
  last_name: string
  email: string
  role: Role
}

export interface LoginResponse extends Tokens {
  chat: ChatSession | null
  user: LoginUser
}

export interface RefreshRequest {
  refresh_token: string
}

export interface RefreshResponse extends Tokens {
  chat: ChatSession | null
}

export interface MeResponse {
  user_id: number
  first_name: string
  last_name: string
  email: string
  role: Role
  phone_number: string | null
  profile_image: string | null
  status: boolean
}

export interface LogoutResponse {
  message: string
}
