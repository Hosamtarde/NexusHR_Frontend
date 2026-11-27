import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { env } from './env'
import { getAccessToken } from './session'
import type { ApiEnvelope, ApiErrorBody } from '@/types/common'

export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.messages = messages
  }
}

export const client = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

const isEnvelope = (body: unknown): body is ApiEnvelope<unknown> =>
  typeof body === 'object' && body !== null && 'success' in body && 'data' in body

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof AxiosError) {
    const body = error.response?.data as Partial<ApiErrorBody> | undefined
    const raw = body?.message
    const messages = Array.isArray(raw) ? raw : raw ? [raw] : [error.message]
    return new ApiError(error.response?.status ?? 0, messages)
  }
  return new ApiError(0, [error instanceof Error ? error.message : String(error)])
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await client.request<unknown>(config)
    return (isEnvelope(response.data) ? response.data.data : response.data) as T
  } catch (error) {
    throw toApiError(error)
  }
}

export const http = {
  get: <T>(url: string, params?: object) => request<T>({ method: 'GET', url, params }),
  post: <T>(url: string, data?: unknown) => request<T>({ method: 'POST', url, data }),
  put: <T>(url: string, data?: unknown) => request<T>({ method: 'PUT', url, data }),
  patch: <T>(url: string, data?: unknown) => request<T>({ method: 'PATCH', url, data }),
  delete: <T>(url: string) => request<T>({ method: 'DELETE', url }),
  blob: (url: string, params?: object) => request<Blob>({ method: 'GET', url, params, responseType: 'blob' }),
}
