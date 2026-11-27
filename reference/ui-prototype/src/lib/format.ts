import { getLang } from '@/i18n/runtime'

const localeOf = () => (getLang() === 'ar' ? 'ar-u-nu-latn' : 'en-US')

const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat | Intl.RelativeTimeFormat>()

function dateFormat(name: string, options: Intl.DateTimeFormatOptions) {
  const key = `${localeOf()}:${name}`
  let formatter = cache.get(key) as Intl.DateTimeFormat | undefined
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(localeOf(), options)
    cache.set(key, formatter)
  }
  return formatter
}

function numberFormat(name: string, options: Intl.NumberFormatOptions) {
  const key = `${getLang()}:${name}`
  let formatter = cache.get(key) as Intl.NumberFormat | undefined
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', options)
    cache.set(key, formatter)
  }
  return formatter
}

function toDate(value: string | Date) {
  if (value instanceof Date) return value
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
}

export const formatDate = (value: string | Date | null | undefined) =>
  value ? dateFormat('date', { day: 'numeric', month: 'long', year: 'numeric' }).format(toDate(value)) : '—'

export const formatShortDate = (value: string | Date | null | undefined) =>
  value ? dateFormat('short', { day: 'numeric', month: 'short' }).format(toDate(value)) : '—'

export const formatMonth = (value: string | Date | null | undefined) =>
  value ? dateFormat('month', { month: 'long', year: 'numeric' }).format(toDate(value)) : '—'

export const formatDateTime = (value: string | Date | null | undefined) =>
  value
    ? dateFormat('datetime', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(toDate(value))
    : '—'

export const formatWeekday = (value: string | Date) => dateFormat('weekday', { weekday: 'long' }).format(toDate(value))

export const formatWeekdayShort = (value: string | Date) => dateFormat('weekdayShort', { weekday: 'short' }).format(toDate(value))

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return '—'
  const formatter = dateFormat('time', { hour: 'numeric', minute: '2-digit' })
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value)) {
    const [h, m] = value.split(':').map(Number)
    const d = new Date()
    d.setHours(h ?? 0, m ?? 0, 0, 0)
    return formatter.format(d)
  }
  return formatter.format(toDate(value))
}

export const formatNumber = (value: number | null | undefined) =>
  value == null ? '—' : numberFormat('number', { maximumFractionDigits: 1 }).format(value)

export function formatMoney(value: number | null | undefined) {
  if (value == null) return '—'
  const text = numberFormat('money', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  return getLang() === 'ar' ? `${text} ₪` : `₪${text}`
}

export function formatRelative(value: string | Date) {
  const key = `${getLang()}:relative`
  let formatter = cache.get(key) as Intl.RelativeTimeFormat | undefined
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(localeOf(), { numeric: 'auto' })
    cache.set(key, formatter)
  }
  const diff = (toDate(value).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return formatter.format(0, 'second')
  if (abs < 3600) return formatter.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return formatter.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return formatter.format(Math.round(diff / 86400), 'day')
  return formatDate(value)
}

export function daysBetween(from: string, to: string) {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86400000) + 1
}

export function fullName(user: { first_name: string; last_name: string } | null | undefined) {
  return user ? `${user.first_name} ${user.last_name}` : '—'
}
