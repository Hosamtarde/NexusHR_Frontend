import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem<T extends string> {
  value: T
  label: string
  count?: number
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

export function Tabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.value === value)
    let next = index
    if (event.key === 'ArrowLeft') next = (index + 1) % items.length
    else if (event.key === 'ArrowRight') next = (index - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else return
    event.preventDefault()
    const item = items[next]
    if (!item) return
    onChange(item.value)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div className={cn('scrollbar-thin -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex min-w-max gap-1 border-b border-ink-200"
      >
        {items.map((item) => {
          const selected = item.value === value
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.value)}
              className={cn(
                'relative -mb-px flex h-10 items-center gap-2 border-b-2 px-3 text-base font-medium transition-colors',
                selected ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-600 hover:text-ink-900',
              )}
            >
              {item.label}
              {item.count != null && (
                <span
                  className={cn(
                    'tabular rounded-full px-1.5 text-xs font-semibold',
                    selected ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-600',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
