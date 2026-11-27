import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { FileText, Search, Upload, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Tone } from '@/lib/labels'
import { toneDot } from '@/lib/tones'
import { useI18n } from '@/i18n'
import { SectionTabs } from '@/components/layout/SectionTabs'
import { locate, tabsFor } from '@/app/nav'
import { useViewer } from '@/app/viewer-context'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  breadcrumbs?: { label: string; to?: string }[]
  meta?: ReactNode
}

export function PageHeader({ title, description, actions, meta }: PageHeaderProps) {
  const { t } = useI18n()
  const { role } = useViewer()
  const { pathname } = useLocation()
  const located = locate(role, pathname)
  const named = located?.tab?.to === pathname && tabsFor(located.item, role).length >= 2
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{named && located ? t(located.item.label) : title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-base text-ink-600">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <SectionTabs className="mt-5" />
    </div>
  )
}

interface Metric {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: Tone
  to?: string
}

export function MetricStrip({ items, className }: { items: Metric[]; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 overflow-hidden rounded-surface border border-ink-200 bg-white sm:grid-cols-3',
        items.length >= 5 ? 'lg:grid-cols-6' : 'lg:grid-cols-4',
        className,
      )}
    >
      {items.map((item) => {
        const body = (
          <>
            <span className="flex items-center gap-1.5 text-sm text-ink-600">
              {item.tone && <span className={cn('size-1.5 rounded-full', toneDot(item.tone))} aria-hidden />}
              {item.label}
            </span>
            <span className="tabular mt-1.5 block text-2xl font-semibold text-ink-900 sm:text-3xl">{item.value}</span>
            {item.hint && <span className="mt-1 block text-sm text-ink-500">{item.hint}</span>}
          </>
        )
        const classes =
          '-mb-px -ms-px block border-b border-s border-ink-100 px-4 py-4 sm:px-5 sm:py-5 transition-colors'
        return item.to ? (
          <Link key={item.label} to={item.to} className={cn(classes, 'hover:bg-brand-50/60')}>
            {body}
          </Link>
        ) : (
          <div key={item.label} className={classes}>
            {body}
          </div>
        )
      })}
    </div>
  )
}

interface ProgressProps {
  value: number
  tone?: 'brand' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
  label?: string
  showValue?: boolean
  className?: string
}

export function Progress({ value, tone = 'brand', size = 'sm', label, showValue, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const fill = { brand: 'bg-brand-600', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }[tone]
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn('flex-1 overflow-hidden rounded-full bg-ink-100', size === 'sm' ? 'h-1.5' : 'h-2.5')}
      >
        <div className={cn('h-full rounded-full transition-[width]', fill)} style={{ width: `${clamped}%` }} />
      </div>
      {showValue && <span className="tabular w-10 shrink-0 text-end text-sm text-ink-700">{Math.round(clamped)}%</span>}
    </div>
  )
}

interface TimelineItem {
  title: ReactNode
  time?: ReactNode
  description?: ReactNode
  tone?: Tone
  current?: boolean
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative">
      {items.map((item, index) => (
        <li key={index} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && <span className="absolute top-4 start-[5px] h-full w-px bg-ink-200" aria-hidden />}
          <span
            className={cn(
              'relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-white',
              item.current ? 'bg-brand-600' : toneDot(item.tone ?? 'neutral'),
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-medium text-ink-900">{item.title}</p>
            {item.time && <p className="text-sm text-ink-500">{item.time}</p>}
            {item.description && <p className="mt-1 text-base text-ink-700">{item.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

export function SearchInput({ value, onChange, placeholder, className, label }: SearchInputProps) {
  const { t } = useI18n()
  const hint = placeholder ?? t('act.search')
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  const timer = useRef<number | undefined>(undefined)

  if (value !== synced) {
    setSynced(value)
    setDraft(value)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const update = (next: string, immediate = false) => {
    setDraft(next)
    window.clearTimeout(timer.current)
    if (immediate) onChange(next)
    else timer.current = window.setTimeout(() => onChange(next), 250)
  }

  return (
    <div className={cn('relative col-span-2', className)}>
      <Search
        className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ink-400"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        type="search"
        value={draft}
        onChange={(event) => update(event.target.value)}
        placeholder={hint}
        aria-label={label ?? hint}
        className="h-10 w-full rounded-control border border-ink-200 bg-white ps-9 pe-8 text-base shadow-sm placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => update('', true)}
          className="absolute inset-y-0 end-2 my-auto grid size-6 place-items-center rounded text-ink-400 hover:text-ink-700"
          aria-label={t('act.clearSearch')}
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 border-b border-ink-100 p-3 sm:flex sm:flex-wrap sm:items-center sm:p-4', className)}>
      {children}
    </div>
  )
}

interface FileDropProps {
  file: File | null
  onChange: (file: File | null) => void
  accept?: string
  maxSizeMb?: number
  hint?: string
  error?: string
  onError?: (message: string | undefined) => void
}

export function FileDrop({ file, onChange, accept = '.pdf', maxSizeMb = 5, hint, error, onError }: FileDropProps) {
  const { t } = useI18n()
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const take = (candidate: File | undefined) => {
    if (!candidate) return
    if (accept === '.pdf' && !candidate.name.toLowerCase().endsWith('.pdf')) {
      onError?.(t('file.pdfOnly'))
      return
    }
    if (candidate.size > maxSizeMb * 1024 * 1024) {
      onError?.(t('file.tooLarge', { n: maxSizeMb }))
      return
    }
    onError?.(undefined)
    onChange(candidate)
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-surface border border-ink-200 bg-ink-25 p-3">
        <span className="grid size-10 place-items-center rounded-control bg-danger-bg text-danger">
          <FileText className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink-900" dir="ltr">
            {file.name}
          </p>
          <p className="text-sm text-ink-500">{(file.size / 1024 / 1024).toFixed(2)} {t('file.mb')}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-control px-2.5 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100"
        >
          {t('act.remove')}
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          take(event.dataTransfer.files[0])
        }}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-surface border-2 border-dashed px-4 py-7 text-center transition-colors',
          dragging ? 'border-brand-500 bg-brand-50' : error ? 'border-danger-border bg-danger-bg/40' : 'border-ink-200 bg-ink-25 hover:border-brand-300 hover:bg-brand-50/50',
        )}
      >
        <Upload className="size-6 text-brand-600" strokeWidth={1.5} />
        <span className="font-medium text-ink-800">{t('file.drop')}</span>
        <span className="text-sm text-ink-500">{hint ?? t('file.hint', { n: maxSizeMb })}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => take(event.target.files?.[0])}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
}

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>

interface ShortcutProps {
  icon: IconType
  label: string
  description?: string
  to: string
}

export function Shortcut({ icon: Icon, label, description, to }: ShortcutProps) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-surface border border-ink-200 bg-white px-3.5 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-brand-50 text-brand-700 group-hover:bg-brand-100">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-ink-900">{label}</span>
        {description && <span className="block truncate text-sm text-ink-500">{description}</span>}
      </span>
    </Link>
  )
}

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warning' | 'danger' | 'success'; title?: string; children: ReactNode }) {
  const tones = {
    info: 'border-info-border bg-info-bg text-info',
    warning: 'border-warning-border bg-warning-bg text-warning',
    danger: 'border-danger-border bg-danger-bg text-danger',
    success: 'border-success-border bg-success-bg text-success',
  }
  return (
    <div className={cn('rounded-surface border px-4 py-3', tones[tone])} role="note">
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn('text-base text-ink-800', title && 'mt-0.5')}>{children}</div>
    </div>
  )
}
