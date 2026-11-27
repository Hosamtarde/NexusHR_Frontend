import type { Role } from './auth'

export interface User {
  user_id: number
  first_name: string
  last_name: string
  email: string
  role: Role
  phone_number: string | null
  profile_image: string | null
  status: boolean
  created_at: string
}

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  phone_number?: string
  profile_image?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface SetPasswordRequest {
  new_password: string
}

export interface UpdateRoleRequest {
  role: Role
}
