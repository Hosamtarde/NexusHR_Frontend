import { attendance } from '@/features/attendance/data'
import { activeEmployees, departments } from '@/features/employees/data'
import { addDays, isWeekend, NOW_TIME, TODAY } from '@/lib/dates'
import { tr } from '@/i18n'
import type { AppRecord } from '@/features/recruitment/data'
import type { Task } from '@/types/entities'
import { formatWeekdayShort } from '@/lib/format'

export interface DayAttendance {
  date: string
  day: string
  onTime: number
  late: number
}

export function weeklyAttendance(): DayAttendance[] {
  const days: string[] = []
  let cursor = TODAY
  while (days.length < 5) {
    if (!isWeekend(cursor)) days.unshift(cursor)
    cursor = addDays(cursor, -1)
  }
  return days.map((date) => {
    const records = attendance.filter((record) => record.attendance_date === date)
    return {
      date,
      day: formatWeekdayShort(date),
      onTime: records.filter((record) => record.attendance_status === 'present').length,
      late: records.filter((record) => record.attendance_status === 'late').length,
    }
  })
}

export interface ScheduleEvent {
  at: string
  title: string
  kind: 'interview' | 'deadline'
  to?: string
}

export function hrSchedule(applications: AppRecord[], tasks: Task[]): ScheduleEvent[] {
  const end = addDays(TODAY, 6)
  const interviews = applications
    .filter((item) => item.interview_at && item.interview_at.slice(0, 10) >= TODAY && item.interview_at.slice(0, 10) <= end)
    .map((item): ScheduleEvent => ({ at: item.interview_at ?? '', kind: 'interview', title: tr('dash.ev.interview', { name: item.applicant_name, job: item.applied_position }), to: `/recruitment/${item.application_id}` }))
  const deadlines = tasks
    .filter((item) => item.deadline >= TODAY && item.deadline <= end && item.task_status !== 'completed' && item.task_status !== 'cancelled')
    .map((item): ScheduleEvent => ({ at: item.deadline, kind: 'deadline', title: tr('dash.ev.deadline', { title: item.task_title }), to: `/tasks/${item.task_id}` }))
  return [...interviews, ...deadlines].sort((x, y) => x.at.localeCompare(y.at))
}

export function interviewsThisWeek(applications: AppRecord[]) {
  const end = addDays(TODAY, 6)
  return applications.filter((item) => item.interview_at && item.interview_at.slice(0, 10) >= TODAY && item.interview_at.slice(0, 10) <= end).length
}

export const isUpcoming = (event: ScheduleEvent) => event.at.length <= 10 || event.at.slice(0, 10) > TODAY || event.at.slice(11, 16) >= NOW_TIME

export function headcount() {
  const people = activeEmployees()
  return { total: people.length, departments: departments.length }
}

export function presentToday() {
  const ids = new Set(activeEmployees().map((row) => row.user.user_id))
  return attendance.filter((record) => record.attendance_date === TODAY && ids.has(record.user_id) && (record.attendance_status === 'present' || record.attendance_status === 'late')).length
}
