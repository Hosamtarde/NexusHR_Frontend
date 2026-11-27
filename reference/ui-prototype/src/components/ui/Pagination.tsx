import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'
import { countOf, type CountNoun } from '@/lib/count'

interface PaginationProps {
  page: number
  limit: number
  total: number
  onChange: (page: number) => void
  noun?: CountNoun
  className?: string
}

function pageList(page: number, pages: number) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1)
  const set = new Set([1, pages, page, page - 1, page + 1])
  const list = [...set].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  list.forEach((value, index) => {
    const previous = list[index - 1]
    if (previous !== undefined && value - previous > 1) result.push('gap')
    result.push(value)
  })
  return result
}

export function Pagination({ page, limit, total, onChange, noun = 'item', className }: PaginationProps) {
  const { t } = useI18n()
  const pages = Math.max(1, Math.ceil(total / limit))
  if (total <= limit) {
    return total > 0 ? (
      <p className={cn('px-4 py-3 text-sm text-ink-500 sm:px-5', className)}>{countOf(noun, total)}</p>
    ) : null
  }
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const navButton =
    'grid size-8 place-items-center rounded-control text-ink-600 hover:bg-ink-100 disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav
      aria-label={t('page.label')}
      className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 sm:px-5', className)}
    >
      <p className="tabular text-sm text-ink-500">
        {t('page.range', { from: formatNumber(from), to: formatNumber(to), total: formatNumber(total) })}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className={navButton} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label={t('page.prev')}>
          <ChevronLeft className="size-4 rtl:rotate-180" strokeWidth={1.75} />
        </button>
        {pageList(page, pages).map((value, index) =>
          value === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-ink-400">
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              aria-current={value === page ? 'page' : undefined}
              className={cn(
                'tabular hidden h-8 min-w-8 rounded-control px-2 text-sm font-medium sm:block',
                value === page ? 'bg-brand-600 text-white' : 'text-ink-700 hover:bg-ink-100',
              )}
            >
              {value}
            </button>
          ),
        )}
        <span className="tabular px-2 text-sm text-ink-600 sm:hidden">
          {page} / {pages}
        </span>
        <button
          type="button"
          className={navButton}
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          aria-label={t('page.next')}
        >
          <ChevronRight className="size-4 rtl:rotate-180" strokeWidth={1.75} />
        </button>
      </div>
    </nav>
  )
}
