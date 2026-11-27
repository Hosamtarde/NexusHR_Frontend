import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { useCountUp } from '@/lib/useCountUp'
import { Skeleton } from '@/components/ui'

interface HeroBannerProps {
  title: string
  eyebrow?: string
  summary: ReactNode
  actions?: ReactNode
}

export function HeroBanner({ title, eyebrow, summary, actions }: HeroBannerProps) {
  return (
    <section className="rounded-surface bg-side-800 px-6 py-6 text-white sm:px-8 sm:py-7">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-sm font-medium text-white/70">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-xl text-md text-white/80">{summary}</p>
      </div>
      {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
    </section>
  )
}

export const heroSolid = 'border-transparent bg-white text-side-900 shadow-md hover:bg-brand-50 active:bg-brand-100'
export const heroOutline = 'border border-white/40 bg-white/5 text-white shadow-none hover:bg-white/15 hover:border-white/60 active:bg-white/20'

interface StatCardProps {
  label: string
  value: number
  suffix?: string
  hint?: ReactNode
  to?: string
  loading?: boolean
}

export function StatCard({ label, value, suffix = '', hint, to, loading }: StatCardProps) {
  const { t } = useI18n()
  const shown = useCountUp(value, !loading)

  if (loading) {
    return (
      <div className="rounded-surface border border-ink-200/80 bg-white p-5 shadow-card" role="status" aria-label={t('state.loading')}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-20" />
        <Skeleton className="mt-3 h-3.5 w-32" />
      </div>
    )
  }

  const body = (
    <>
      <p className="text-sm font-medium text-ink-600">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="tabular text-4xl font-bold tracking-tight text-ink-900">
          {formatNumber(Math.max(0, Math.round(shown)))}
          {suffix && <span className="ms-0.5 text-xl font-semibold text-ink-500">{suffix}</span>}
        </p>
      </div>
      {hint && <p className="mt-2 text-sm text-ink-500">{hint}</p>}
    </>
  )

  const classes = 'block rounded-surface border border-ink-200/80 bg-white p-5 shadow-card'
  return to ? (
    <Link to={to} className={cn(classes, 'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover')}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  )
}
