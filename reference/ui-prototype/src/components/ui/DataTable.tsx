import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { LoadStatus } from '@/lib/sample'
import { ErrorState, SkeletonRows } from './States'

export const rowPlain = 'even:bg-ink-600/[0.035] hover:bg-brand-600/[0.08] hover:even:bg-brand-600/[0.08]'
export const rowSelected = 'bg-brand-100/70'

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
  align?: 'start' | 'end' | 'center'
  mobile?: 'primary' | 'meta' | 'hidden' | 'aside'
  sortable?: boolean
}

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  rowHref?: (row: T) => string
  rowLabel?: (row: T) => string
  status?: LoadStatus
  onRetry?: () => void
  empty?: ReactNode
  caption?: string
  dense?: boolean
  selectedKey?: string | number
  sort?: SortState | null
  onSort?: (key: string) => void
  markKey?: string | number
  flashMark?: boolean
}

const alignClass = { start: 'text-start', end: 'text-end', center: 'text-center' }

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  rowLabel,
  status = 'ready',
  onRetry,
  empty,
  caption,
  dense,
  selectedKey,
  sort,
  onSort,
  markKey,
  flashMark,
}: DataTableProps<T>) {
  if (status === 'loading') return <SkeletonRows />
  if (status === 'error') return <ErrorState onRetry={onRetry} />
  if (rows.length === 0) return <>{empty}</>

  const primary = columns.find((column) => column.mobile === 'primary') ?? columns[0]!
  const aside = columns.find((column) => column.mobile === 'aside')
  const meta = columns.filter((column) => column !== primary && column !== aside && column.mobile !== 'hidden')

  return (
    <>
      <div className="scrollbar-thin relative hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-base">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-ink-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={sort?.key === column.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'bg-brand-50/70 px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap text-ink-600 shadow-[inset_0_-1px_0_var(--color-ink-200)]',
                    alignClass[column.align ?? 'start'],
                    column.className,
                  )}
                >
                  {column.sortable && onSort ? (
                    <button type="button" onClick={() => onSort(column.key)} className="inline-flex items-center gap-1 rounded hover:text-ink-900">
                      {column.header}
                      {sort?.key === column.key ? (sort.dir === 'asc' ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />) : <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => {
              const key = rowKey(row)
              const href = rowHref?.(row)
              const selected = selectedKey === key
              const marked = markKey !== undefined && markKey === key
              return (
                <tr
                  key={key}
                  data-me={marked ? 'true' : undefined}
                  aria-current={marked ? 'true' : undefined}
                  className={cn(
                    'group relative transition-colors',
                    selected ? rowSelected : marked ? 'bg-brand-50' : rowPlain,
                    marked && flashMark && 'motion-safe:animate-[org-flash_1.6s_ease-out_1]',
                  )}
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-5 align-middle text-ink-800',
                        dense ? 'py-2.5' : 'py-4',
                        alignClass[column.align ?? 'start'],
                        index === 0 && marked && 'shadow-[inset_4px_0_0_var(--color-brand-600)] rtl:shadow-[inset_-4px_0_0_var(--color-brand-600)]',
                        index === 0 && !marked &&
                          (selected
                            ? 'shadow-[inset_-3px_0_0_var(--color-brand-600)]'
                            : href && 'group-hover:shadow-[inset_-3px_0_0_var(--color-brand-600)]'),
                        column.className,
                      )}
                    >
                      {href && column === primary ? (
                        <Link
                          to={href}
                          aria-label={rowLabel?.(row)}
                          className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand-500"
                        >
                          {column.cell(row)}
                        </Link>
                      ) : (
                        <div className="relative z-[1] w-fit max-w-full [&:not(:has(a,button))]:pointer-events-none">
                          {column.cell(row)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-ink-100 md:hidden">
        {rows.map((row) => {
          const key = rowKey(row)
          const href = rowHref?.(row)
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">{primary.cell(row)}</div>
                {aside && <div className="shrink-0">{aside.cell(row)}</div>}
              </div>
              {meta.length > 0 && (
                <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
                  {meta.map((column) => (
                    <div key={column.key} className="min-w-0">
                      <dt className="text-xs text-ink-500">{column.header}</dt>
                      <dd className="mt-0.5 text-sm text-ink-800">{column.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </>
          )
          return (
            <li key={key} data-me={markKey !== undefined && markKey === key ? 'true' : undefined} aria-current={markKey !== undefined && markKey === key ? 'true' : undefined} className={cn(selectedKey === key ? rowSelected : markKey !== undefined && markKey === key ? 'border-s-4 border-brand-600 bg-brand-50' : rowPlain, markKey !== undefined && markKey === key && flashMark && 'motion-safe:animate-[org-flash_1.6s_ease-out_1]')}>
              {href ? (
                <Link to={href} aria-label={rowLabel?.(row)} className="block px-4 py-3.5 active:bg-ink-50">
                  {body}
                </Link>
              ) : (
                <div className="px-4 py-3.5">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
