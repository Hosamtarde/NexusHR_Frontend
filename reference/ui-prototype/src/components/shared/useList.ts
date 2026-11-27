import { useMemo, useState } from 'react'
import { useSample } from '@/lib/sample'
import type { SortState } from '@/components/ui'

export interface FilterDef<T> {
  key: string
  label: string
  allLabel: string
  options: { value: string | number; label: string }[]
  test: (row: T, value: string) => boolean
}

interface UseListOptions<T> {
  rows: T[]
  search?: (row: T) => string
  filters?: FilterDef<T>[]
  sorters?: Record<string, (a: T, b: T) => number>
  initialSort?: SortState
  limit?: number
}

export function useList<T>({ rows, search, filters = [], sorters = {}, initialSort, limit = 10 }: UseListOptions<T>) {
  const [q, setQ] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<SortState | null>(initialSort ?? null)
  const [page, setPage] = useState(1)
  const { status, data, retry } = useSample(() => rows, [] as T[])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = data.filter((row) => (!needle || !search || search(row).toLowerCase().includes(needle)) && filters.every((filter) => !values[filter.key] || filter.test(row, values[filter.key]!)))
    const sorter = sort ? sorters[sort.key] : undefined
    if (sort && sorter) list = list.slice().sort((a, b) => (sort.dir === 'asc' ? sorter(a, b) : sorter(b, a)))
    return list
  }, [data, q, values, sort, search, filters, sorters])

  const lastPage = Math.max(1, Math.ceil(filtered.length / limit))
  const current = Math.min(page, lastPage)
  return {
    status,
    retry,
    q,
    setQ: (next: string) => { setQ(next); setPage(1) },
    values,
    setValue: (key: string, value: string) => { setValues((old) => ({ ...old, [key]: value })); setPage(1) },
    sort,
    toggleSort: (key: string) => setSort((old) => (old?.key === key ? (old.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' })),
    page: current,
    setPage,
    limit,
    total: filtered.length,
    all: data,
    filtered,
    items: filtered.slice((current - 1) * limit, current * limit),
    filters,
  }
}
