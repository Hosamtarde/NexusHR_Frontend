export const TODAY = '2026-11-12'

export function toIso(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromIso(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`)
}

export function addDays(value: string, days: number) {
  const date = fromIso(value)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

export function isWeekend(value: string) {
  const day = fromIso(value).getDay()
  return day === 5 || day === 6
}

export function seeded(seed: number) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}
export const NOW_TIME = '10:30'
