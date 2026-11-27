import type { Attendance, AttendanceStatus } from '@/types/entities'
import { addDays, isWeekend, seeded, TODAY } from '@/lib/dates'
import { activeEmployees } from '@/features/employees/data'
import { tr } from '@/i18n'

const DAYS_BACK = 75
const todayCheckedIn = new Set([1, 2, 3, 4, 6, 7, 8, 9, 10, 13, 15, 16, 17, 18, 20, 23])
const todayLate = new Set([11, 19])
const todayLeave = new Set([14])

function time(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
}

function build(): Attendance[] {
  const records: Attendance[] = []
  let id = 1
  const ids = activeEmployees().map((row) => row.user.user_id)
  for (let offset = DAYS_BACK; offset >= 0; offset--) {
    const date = addDays(TODAY, -offset)
    if (isWeekend(date)) continue
    for (const userId of ids) {
      const random = seeded(userId * 7919 + offset * 104729)
      let status: AttendanceStatus
      let checkIn: string | null = null
      let checkOut: string | null = null
      if (offset === 0) {
        if (todayLeave.has(userId)) status = 'on_leave'
        else if (todayLate.has(userId)) {
          status = 'late'
          checkIn = time(8, 20 + Math.floor(random() * 30))
        } else if (todayCheckedIn.has(userId)) {
          status = 'present'
          checkIn = time(7, 40 + Math.floor(random() * 19))
        } else continue
      } else {
        const roll = random()
        status = roll < 0.8 ? 'present' : roll < 0.9 ? 'late' : roll < 0.95 ? 'on_leave' : 'absent'
        if (status === 'present') checkIn = time(7, 35 + Math.floor(random() * 24))
        if (status === 'late') checkIn = time(8, 16 + Math.floor(random() * 40))
        if (checkIn) checkOut = time(15 + Math.floor(random() * 2), Math.floor(random() * 59))
      }
      let hours: number | null = null
      if (checkIn && checkOut) {
        const [ih, im] = checkIn.split(':').map(Number) as [number, number]
        const [oh, om] = checkOut.split(':').map(Number) as [number, number]
        hours = Math.round(((oh * 60 + om - (ih * 60 + im)) / 60) * 100) / 100
      }
      records.push({
        attendance_id: id++,
        user_id: userId,
        check_in_time: checkIn,
        check_out_time: checkOut,
        working_hours: hours,
        attendance_status: status,
        attendance_date: date,
      })
    }
  }
  return records
}

export const attendance = build()

export function attendanceFor(userId: number, from?: string, to?: string) {
  return attendance
    .filter(
      (record) =>
        record.user_id === userId &&
        (!from || record.attendance_date >= from) &&
        (!to || record.attendance_date <= to),
    )
    .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
}

export function todayRecord(userId: number) {
  return attendance.find((record) => record.user_id === userId && record.attendance_date === TODAY) ?? null
}

export function todayStatusLabel(userId: number) {
  const record = todayRecord(userId)
  if (!record) return tr('person.notCheckedIn')
  return tr(`status.${record.attendance_status}`)
}

export function summarize(records: Attendance[]) {
  const count = (status: AttendanceStatus) => records.filter((record) => record.attendance_status === status).length
  const hours = records.reduce((sum, record) => sum + (record.working_hours ?? 0), 0)
  return {
    present: count('present'),
    late: count('late'),
    absent: count('absent'),
    onLeave: count('on_leave'),
    total: records.length,
    hours: Math.round(hours * 10) / 10,
  }
}
