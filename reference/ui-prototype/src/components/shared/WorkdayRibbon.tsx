import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { NOW_TIME } from '@/lib/dates'
import { formatTime } from '@/lib/format'
import { useI18n } from '@/i18n'

export interface WorkdayEvent {
  time: string
  label: string
  to?: string
  kind?: 'deadline' | 'interview'
}

interface WorkdayRibbonProps {
  checkIn: string | null
  checkOut?: string | null
  events?: WorkdayEvent[]
  start?: string
  end?: string
  compact?: boolean
  className?: string
}

const toMinutes = (value: string) => {
  const [h, m] = value.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

const kindColor = {
  deadline: 'bg-warning',
  interview: 'bg-info',
}

export function WorkdayRibbon({ checkIn, checkOut = null, events = [], start = '08:00', end = '16:00', compact, className }: WorkdayRibbonProps) {
  const { t } = useI18n()
  const from = toMinutes(start)
  const to = toMinutes(end)
  const span = to - from
  const pos = (value: string) => Math.max(0, Math.min(100, ((toMinutes(value) - from) / span) * 100))
  const now = pos(NOW_TIME)
  const fillStart = checkIn ? pos(checkIn) : 0
  const fillEnd = checkIn ? (checkOut ? pos(checkOut) : now) : 0
  const worked = checkIn ? toMinutes(checkOut ?? NOW_TIME) - toMinutes(checkIn) : 0
  const remaining = Math.max(0, to - toMinutes(NOW_TIME))
  const hours = Array.from({ length: span / 60 + 1 }, (_, index) => from / 60 + index)

  const summary = checkIn ? t('wr.summary', { time: formatTime(checkIn), h: Math.floor(worked / 60), m: worked % 60 }) + (checkOut ? '' : t('wr.left', { h: Math.floor(remaining / 60), m: remaining % 60 })) : t('wr.notIn')

  return (
    <div className={cn('w-full', className)}>
      {!compact && (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm text-ink-600">
            {t('wr.day', { start: formatTime(start), end: formatTime(end) })}
          </p>
          <p className="text-sm text-ink-800">
            {checkIn ? (
              <>
                <span className="tabular font-semibold text-ink-900">
                  {Math.floor(worked / 60)}:{String(worked % 60).padStart(2, '0')}
                </span>{' '}
                {t('wr.worked')}
                {!checkOut && <span className="text-ink-500"> {t('wr.sofar')}</span>}
              </>
            ) : (
              <span className="text-warning">{t('wr.notIn')}</span>
            )}
          </p>
        </div>
      )}
      <div className="relative" role="img" aria-label={summary}>
        <div className={cn('relative overflow-hidden rounded-full bg-ink-100', compact ? 'h-2' : 'h-3')}>
          <div
            className="absolute inset-y-0 rounded-full bg-brand-600 transition-[width] duration-200"
            style={{ insetInlineStart: `${fillStart}%`, width: `${Math.max(0, fillEnd - fillStart)}%` }}
          />
          <div
            className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,var(--color-brand-200)_0_3px,transparent_3px_7px)]"
            style={{ insetInlineStart: `${fillEnd}%`, width: `${Math.max(0, 100 - fillEnd)}%`, opacity: checkIn && !checkOut ? 0.7 : 0 }}
          />
        </div>
        {!checkOut && (
          <span
            className={cn('absolute top-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-brand-700', compact ? 'size-3' : 'size-4')}
            style={{ insetInlineStart: `calc(${now}% - ${compact ? 6 : 8}px)` }}
            aria-hidden
          />
        )}
        {!compact &&
          events.map((event) => {
            const marker = (
              <>
                <span className={cn('size-2 rounded-full ring-2 ring-white', kindColor[event.kind ?? 'deadline'])} aria-hidden />
                <span className="hidden whitespace-nowrap text-xs text-ink-700 group-hover:text-brand-700 sm:block">
                  <span className="tabular">{formatTime(event.time)}</span> {event.label}
                </span>
              </>
            )
            const style = { insetInlineStart: `${pos(event.time)}%` }
            const classes = 'group absolute top-5 flex -translate-x-1/2 flex-col items-center gap-1 rtl:translate-x-1/2'
            return event.to ? (
              <Link key={`${event.time}-${event.label}`} to={event.to} className={cn(classes, 'rounded-control')} style={style} title={event.label}>
                {marker}
              </Link>
            ) : (
              <span key={`${event.time}-${event.label}`} className={classes} style={style}>
                {marker}
              </span>
            )
          })}
      </div>
      {!compact && (
        <div className={cn('relative mt-1 h-4', events.length > 0 && 'mt-11')} aria-hidden>
          {hours.map((hour) => (
            <span
              key={hour}
              className="tabular absolute -translate-x-1/2 text-xs text-ink-400 rtl:translate-x-1/2"
              style={{ insetInlineStart: `${((hour * 60 - from) / span) * 100}%` }}
            >
              {hour}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
