import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Label, Tone } from '@/lib/labels'
import { toneDot } from '@/lib/tones'

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-success-bg text-success ring-success-border',
  warning: 'bg-warning-bg text-warning ring-warning-border',
  danger: 'bg-danger-bg text-danger ring-danger-border',
  info: 'bg-info-bg text-info ring-info-border',
}

interface BadgeProps {
  tone?: Tone
  dot?: boolean
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', dot, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-sm font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', toneDot(tone))} aria-hidden />}
      {children}
    </span>
  )
}

export function StatusBadge({ value }: { value: Label }) {
  return (
    <Badge tone={value.tone} dot>
      {value.label}
    </Badge>
  )
}
