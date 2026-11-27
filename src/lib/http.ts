import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { env } from './env'
import { clearSession, getAccessToken, getRefreshToken, setSession } from './session'
import type { ApiEnvelope, ApiErrorBody } from '@/types/common'
import type { RefreshResponse } from '@/types/auth'

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

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

const publicAuthPaths = ['/auth/login', '/auth/refresh']

export const client = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
})

const isEnvelope = (body: unknown): body is ApiEnvelope<unknown> =>
  typeof body === 'object' && body !== null && 'success' in body && 'data' in body

const unwrap = <T>(body: unknown) => (isEnvelope(body) ? body.data : body) as T

const pathOf = (url: string | undefined) => (url ?? '').replace(env.apiUrl, '').split('?')[0]!

const bearer = (config: InternalAxiosRequestConfig) => {
  const value = config.headers.get('Authorization')
  return typeof value === 'string' ? value.replace(/^Bearer /, '') : null
}

let refreshing: Promise<string | null> | null = null

export function refreshSession(): Promise<string | null> {
  refreshing ??= (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null
    try {
      const response = await axios.post<unknown>(`${env.apiUrl}/auth/refresh`, { refresh_token: refreshToken })
      const data = unwrap<RefreshResponse>(response.data)
      setSession(data, data.chat)
      return data.access_token
    } catch {
      clearSession()
      return null
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && !publicAuthPaths.includes(pathOf(config.url))) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

client.interceptors.response.use(undefined, async (error: unknown) => {
  if (!(error instanceof AxiosError) || error.response?.status !== 401 || !error.config) throw error
  const config = error.config as RetriableConfig
  if (config._retried || publicAuthPaths.includes(pathOf(config.url))) throw error
  config._retried = true
  const sent = bearer(config)
  const latest = getAccessToken()
  const token = latest && latest !== sent ? latest : await refreshSession()
  if (!token) throw error
  config.headers.set('Authorization', `Bearer ${token}`)
  return client.request(config)
})

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
    return unwrap<T>(response.data)
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
