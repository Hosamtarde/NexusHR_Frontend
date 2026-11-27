import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { usePreviewState } from './preview-store'

export type LoadStatus = 'loading' | 'error' | 'ready'


export function useSample<T>(load: () => T, empty: T) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const forced = usePreviewState()
  const [seen, setSeen] = useState(forced)

  if (seen !== forced) {
    setSeen(forced)
    setStatus('loading')
  }

  useEffect(() => {
    if (forced === 'loading') return
    const timer = window.setTimeout(() => setStatus(forced === 'error' ? 'error' : 'ready'), 320)
    return () => window.clearTimeout(timer)
  }, [attempt, forced])

  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt((value) => value + 1)
  }, [])

  return { status, data: forced === 'empty' ? empty : load(), retry }
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit
  return { items: items.slice(start, start + limit), total: items.length, page, limit }
}

export function usePageParam(key = 'page') {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get(key)) || 1)
  const setPage = useCallback(
    (next: number) =>
      setParams(
        (current) => {
          const copy = new URLSearchParams(current)
          if (next <= 1) copy.delete(key)
          else copy.set(key, String(next))
          return copy
        },
        { replace: true },
      ),
    [key, setParams],
  )
  return [page, setPage] as const
}

export function useQueryParam(key: string, fallback = '') {
  const [params, setParams] = useSearchParams()
  const value = params.get(key) ?? fallback
  const setValue = useCallback(
    (next: string) =>
      setParams(
        (current) => {
          const copy = new URLSearchParams(current)
          if (!next || next === fallback) copy.delete(key)
          else copy.set(key, next)
          copy.delete('page')
          return copy
        },
        { replace: true },
      ),
    [fallback, key, setParams],
  )
  return [value, setValue] as const
}

export function useTabParam<T extends string>(values: readonly T[], fallback: T, key = 'tab') {
  const [raw, setRaw] = useQueryParam(key, fallback)
  const value = values.includes(raw as T) ? (raw as T) : fallback
  return [value, setRaw as (next: T) => void] as const
}

export function useAction() {
  const [pending, setPending] = useState(false)
  const run = useCallback(async (task: () => void | Promise<void>, ms = 600) => {
    setPending(true)
    await new Promise((resolve) => window.setTimeout(resolve, ms))
    try {
      await task()
    } finally {
      setPending(false)
    }
  }, [])
  return { pending, run }
}
