import type { ComponentType, ReactNode } from 'react'
import { CircleAlert, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { Button } from './Button'

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-shimmer rounded-control bg-ink-100', className)} aria-hidden />
}

export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  const { t } = useI18n()
  return (
    <div className={cn('divide-y divide-ink-100', className)} role="status" aria-label={t('state.loading')}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
          <Skeleton className="hidden h-3.5 w-24 md:block" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <div className={cn('flex flex-col gap-3', className)} role="status" aria-label={t('state.loading')}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-3.5 w-1/2" />
      <Skeleton className="h-3.5 w-3/5" />
    </div>
  )
}

interface EmptyStateProps {
  icon: IconType
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'px-4 py-8' : 'px-6 py-12', className)}>
      <span className="grid size-12 place-items-center rounded-control bg-ink-100 text-ink-500" aria-hidden>
        <Icon className="size-6" strokeWidth={1.5} />
      </span>
      <h3 className="mt-4 text-md font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-base text-ink-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
  compact?: boolean
}

export function ErrorState({
  title,
  description,
  onRetry,
  className,
  compact,
}: ErrorStateProps) {
  const { t } = useI18n()
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}
    >
      <span className="grid size-12 place-items-center rounded-full bg-danger-bg text-danger">
        <CircleAlert className="size-6" strokeWidth={1.5} />
      </span>
      <h3 className="mt-4 text-md font-semibold text-ink-900">{title ?? t('state.errorTitle')}</h3>
      <p className="mt-1 max-w-sm text-base text-ink-600">{description ?? t('state.errorDesc')}</p>
      {onRetry && (
        <Button variant="secondary" icon={RotateCcw} onClick={onRetry} className="mt-5">
          {t('act.retry')}
        </Button>
      )}
    </div>
  )
}
