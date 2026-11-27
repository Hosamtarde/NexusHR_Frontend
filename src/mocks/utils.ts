import { HttpResponse, delay } from 'msw'
import { env } from '@/lib/env'
import type { Paginated } from '@/types/common'

export const api = (path: string) => `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`

export const ok = <T>(data: T, status = 200) =>
  HttpResponse.json({ success: true as const, data, timestamp: new Date().toISOString() }, { status })

export const fail = (status: number, message: string | string[], path = '') =>
  HttpResponse.json({ statusCode: status, message, path, timestamp: new Date().toISOString() }, { status })

export function paginate<T>(items: readonly T[], request: Request): Paginated<T> {
  const query = new URL(request.url).searchParams
  const page = Math.max(1, Number(query.get('page')) || 1)
  const limit = Math.max(1, Number(query.get('limit')) || 10)
  return {
    data: items.slice((page - 1) * limit, page * limit),
    total: items.length,
    page,
    limit,
    totalPages: Math.ceil(items.length / limit),
  }
}

export const latency = () => delay(import.meta.env.MODE === 'test' ? 0 : 250)
