import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { toneDot } from '@/lib/tones'
import type { Tone } from '@/lib/labels'
import { useI18n } from '@/i18n'
import { Avatar } from '@/components/ui'
import { PersonAvatar, PersonCell, PersonHover } from './Person'

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand-700 hover:underline">
      <ArrowRight className="size-4 ltr:rotate-180" strokeWidth={1.75} aria-hidden />
      {label}
    </Link>
  )
}

interface HeroStat {
  label: string
  value: ReactNode
}

interface DetailHeroProps {
  heading?: string
  name: string
  src?: string | null
  eyebrow?: ReactNode
  position?: string | null
  department?: string | null
  badge: ReactNode
  stats: HeroStat[]
  actions?: ReactNode
  personTo?: string
  userId?: number
}

export function DetailHero({ heading, name, src, eyebrow, position, department, badge, stats, actions, personTo, userId }: DetailHeroProps) {
  const identity = (
    <div className="flex min-w-0 items-center gap-4">
      <span className="shrink-0">
        <Avatar src={src} firstName={name} size="lg" className="size-16" />
      </span>
      <div className="min-w-0">
        {eyebrow && <p className="text-sm text-ink-500">{eyebrow}</p>}
        <p className="truncate text-2xl font-bold tracking-tight text-ink-900">{heading ?? name}</p>
        <p className="truncate text-base text-ink-600">{heading ? [name, position].filter(Boolean).join(' · ') : [position, department].filter(Boolean).join(' · ') || '—'}</p>
      </div>
    </div>
  )
  return (
    <section className="mb-6 overflow-hidden rounded-surface border border-ink-200/80 bg-white shadow-card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        {userId != null ? (
          <PersonHover userId={userId} to={personTo} className="min-w-0 rounded-xl">
            {identity}
          </PersonHover>
        ) : personTo ? (
          <Link to={personTo} className="min-w-0 rounded-xl hover:opacity-90">
            {identity}
          </Link>
        ) : (
          identity
        )}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-base [&_span]:text-base">{badge}</div>
          {actions}
        </div>
      </div>
      {stats.length > 0 && (
        <dl className={cn('grid grid-cols-2 gap-px border-t border-ink-100 bg-ink-100', stats.length >= 4 ? 'sm:grid-cols-4' : stats.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white px-5 py-4">
              <dt className="text-sm text-ink-500">{stat.label}</dt>
              <dd className="tabular mt-1 text-xl font-semibold text-ink-900">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

export function DetailGrid({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-6">{main}</div>
      <aside className="flex min-w-0 flex-col gap-6">{side}</aside>
    </div>
  )
}

export interface RichStep {
  title: ReactNode
  time?: ReactNode
  note?: ReactNode
  userId?: number
  name?: string
  state: 'done' | 'current' | 'next'
  tone?: Tone
}

export function RichTimeline({ steps }: { steps: RichStep[] }) {
  const { t } = useI18n()
  return (
    <ol className="relative">
      {steps.map((step, index) => (
        <li key={index} className="relative flex gap-3 pb-6 last:pb-0">
          {index < steps.length - 1 && <span className="absolute top-9 bottom-0 start-4 w-px bg-ink-200" aria-hidden />}
          <span className={cn('relative shrink-0', step.state === 'next' && 'opacity-50')}>
            {step.userId != null ? <PersonCell userId={step.userId} avatarOnly /> : step.name ? <PersonAvatar firstName={step.name} size="sm" /> : <span className={cn('mt-1 grid size-8 place-items-center rounded-full', step.state === 'current' ? 'bg-brand-600' : toneDot(step.tone ?? 'neutral'))} aria-hidden />}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className={cn('font-medium', step.state === 'next' ? 'text-ink-500' : 'text-ink-900')}>{step.title}</p>
            {step.time && <p className="text-sm text-ink-500">{step.time}</p>}
            {step.state === 'next' && <p className="text-xs font-medium text-brand-700">{t('detail.nextStep')}</p>}
            {step.note && <p className="mt-1 rounded-control bg-ink-50 px-3 py-2 text-sm text-ink-700">{step.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function ActionBar({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  if (aside) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-surface border border-ink-200/80 bg-white p-4 shadow-card max-md:sticky max-md:bottom-3 max-md:z-20 max-md:shadow-md">
        <div className="flex flex-wrap items-center gap-2">{children}</div>
        <div className="ms-auto flex items-center">{aside}</div>
      </div>
    )
  }
  return <div className="mt-6 flex flex-wrap items-center justify-end gap-2 max-md:sticky max-md:bottom-3 max-md:z-20 max-md:rounded-surface max-md:border max-md:border-ink-200 max-md:bg-white max-md:p-3 max-md:shadow-md">{children}</div>
}
