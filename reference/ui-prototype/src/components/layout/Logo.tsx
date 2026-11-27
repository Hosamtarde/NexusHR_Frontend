import { useId } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'

type Tone = 'brand' | 'light'

export function LogoMark({ className, tone = 'brand' }: { className?: string; tone?: Tone }) {
  const id = useId()
  const light = tone === 'light'
  return (
    <svg viewBox="0 0 32 32" className={cn('size-9 shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="4" y1="0" x2="28" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4a86e8" />
          <stop offset="1" stopColor="#1b3f94" />
        </linearGradient>
      </defs>
      {light ? <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="9" fill="#ffffff" fillOpacity="0.12" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" /> : <rect width="32" height="32" rx="9" fill={`url(#${id})`} />}
      <path d="M9.5 22.5V9.5L22.5 22.5V9.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="#fff">
        <circle cx="9.5" cy="22.5" r="2.7" />
        <circle cx="9.5" cy="9.5" r="2.7" />
        <circle cx="22.5" cy="22.5" r="2.7" />
        <circle cx="22.5" cy="9.5" r="2.7" />
      </g>
    </svg>
  )
}

interface LogoProps {
  compact?: boolean
  to?: string
  tone?: Tone
  variant?: 'full' | 'mark'
  className?: string
}

export function Wordmark({ tone = 'brand', className }: { tone?: Tone; className?: string }) {
  const light = tone === 'light'
  return (
    <span dir="ltr" className={cn('text-[19px] leading-none tracking-[-0.02em]', light ? 'text-white' : 'text-ink-900', className)}>
      <span className="font-bold">Nexus</span>
      <span className={cn('font-medium', light ? 'text-brand-200' : 'text-brand-600')}>HR</span>
    </span>
  )
}

export function Logo({ compact, to = '/', tone = 'brand', variant = 'full', className }: LogoProps) {
  const { t } = useI18n()
  const markOnly = compact || variant === 'mark'
  const body = (
    <>
      <LogoMark tone={tone} />
      {!markOnly && (
        <Wordmark tone={tone} />
      )}
    </>
  )
  const label = t('app.name')
  if (!to) return <span className={cn('flex items-center gap-3', className)} role="img" aria-label={label}>{body}</span>
  return (
    <Link to={to} className={cn('flex items-center gap-3 rounded-xl', className)} aria-label={label}>
      {body}
    </Link>
  )
}
