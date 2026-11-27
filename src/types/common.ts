export type Role = 'employee' | 'manager' | 'hr_admin'

export interface ApiEnvelope<T> {
  success: true
  data: T
  timestamp: string
}

export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  path: string
  timestamp: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PageParams {
  page?: number
  limit?: number
}
