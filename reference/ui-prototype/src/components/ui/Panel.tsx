import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PanelProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  className?: string
  bodyClassName?: string
  flush?: boolean
  children?: ReactNode
  as?: 'section' | 'div' | 'article'
}

export function Panel({
  title,
  description,
  actions,
  footer,
  className,
  bodyClassName,
  flush,
  children,
  as: Tag = 'section',
}: PanelProps) {
  return (
    <Tag className={cn('rounded-surface border border-ink-200/80 bg-white shadow-card', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-md font-semibold text-ink-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && 'p-5', bodyClassName)}>{children}</div>
      {footer && <footer className="border-t border-ink-100 px-5 py-3.5">{footer}</footer>}
    </Tag>
  )
}

interface DescriptionListProps {
  items: { label: string; value: ReactNode; wide?: boolean }[]
  columns?: 1 | 2 | 3
  className?: string
}

export function DescriptionList({ items, columns = 2, className }: DescriptionListProps) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={cn('min-w-0', item.wide && 'sm:col-span-full')}>
          <dt className="text-sm text-ink-500">{item.label}</dt>
          <dd className="mt-0.5 text-base text-ink-900 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
