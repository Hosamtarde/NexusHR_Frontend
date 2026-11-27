import { tr } from '@/i18n'
import { attendance } from '@/features/attendance/data'
import { getLeaveType, leaveBalances, remaining } from '@/features/leave/data'
import { payrolls } from '@/features/payroll/data'
import { getPlan, ratingLabel, reviews } from '@/features/performance/data'
import { assignments, isOverdue, tasks } from '@/features/tasks/data'
import { applications } from '@/features/recruitment/data'
import { people, round, type ReportScope } from './data'

export type ReportKind = 'attendance' | 'leave' | 'payroll' | 'performance' | 'tasks' | 'recruitment'
export type CellKind = 'text' | 'number' | 'percent' | 'money' | 'badge'

export interface ReportColumn {
  key: string
  label: string
  kind: CellKind
}

export interface ReportData {
  title: string
  columns: ReportColumn[]
  rows: Record<string, string | number>[]
  summary: { label: string; value: string | number; kind?: CellKind }[]
  chartTitle: string
  chart: { label: string; value: number }[]
  chartMax?: number
  chartKind: CellKind
}

export interface Filters {
  from: string
  to: string
  departmentId?: number
}

const sum = (list: number[]) => list.reduce((total, value) => total + value, 0)

export function buildReport(kind: ReportKind, filters: Filters, scope: ReportScope): ReportData {
  const rowsOf = people(scope, filters.departmentId)
  const ids = new Set(rowsOf.map((row) => row.user.user_id))

  if (kind === 'attendance') {
    const rows = rowsOf.map((row) => {
      const list = attendance.filter((r) => r.user_id === row.user.user_id && r.attendance_date >= filters.from && r.attendance_date <= filters.to)
      const count = (status: string) => list.filter((r) => r.attendance_status === status).length
      const present = count('present')
      const late = count('late')
      const leave = count('on_leave')
      const working = list.length - leave
      return { employee: row.name, department: row.department?.department_name ?? '—', present, late, absent: count('absent'), onLeave: leave, hours: round(sum(list.map((r) => r.working_hours ?? 0))), rate: working ? round(((present + late) / working) * 100) : 0 }
    })
    const avg = rows.length ? round(sum(rows.map((r) => r.rate)) / rows.length) : 0
    return {
      title: tr('rp.att.title'),
      columns: [
        { key: 'employee', label: tr('rp.att.employee'), kind: 'text' },
        { key: 'department', label: tr('rp.att.department'), kind: 'text' },
        { key: 'present', label: tr('rp.att.present'), kind: 'number' },
        { key: 'late', label: tr('rp.att.late'), kind: 'number' },
        { key: 'absent', label: tr('rp.att.absent'), kind: 'number' },
        { key: 'onLeave', label: tr('rp.att.leave'), kind: 'number' },
        { key: 'hours', label: tr('rp.att.hours'), kind: 'number' },
        { key: 'rate', label: tr('rp.att.rate'), kind: 'percent' },
      ],
      rows,
      summary: [{ label: tr('rp.hub.stat.people'), value: rows.length }, { label: tr('rp.att.avg'), value: avg, kind: 'percent' }, { label: tr('rp.att.lateDays'), value: sum(rows.map((r) => r.late)) }, { label: tr('rp.att.absentDays'), value: sum(rows.map((r) => r.absent)) }],
      chartTitle: tr('rp.att.chart'),
      chart: rows.map((r) => ({ label: r.employee, value: r.rate })).sort((a, b) => b.value - a.value).slice(0, 8),
      chartMax: 100,
      chartKind: 'percent',
    }
  }

  if (kind === 'leave') {
    const rows = leaveBalances.filter((b) => ids.has(b.user_id)).map((b) => {
      const row = rowsOf.find((item) => item.user.user_id === b.user_id)!
      const total = b.total_days + b.carried_over
      return { employee: row.name, department: row.department?.department_name ?? '—', leaveType: getLeaveType(b.leave_type_id)?.type_name ?? '—', total, used: b.used_days, remaining: remaining(b), usage: total ? round((b.used_days / total) * 100) : 0 }
    })
    const byType = new Map<string, number>()
    for (const row of rows) byType.set(row.leaveType, (byType.get(row.leaveType) ?? 0) + row.used)
    return {
      title: tr('rp.lv.title'),
      columns: [
        { key: 'employee', label: tr('rp.att.employee'), kind: 'text' },
        { key: 'department', label: tr('rp.att.department'), kind: 'text' },
        { key: 'leaveType', label: tr('rp.lv.type'), kind: 'text' },
        { key: 'total', label: tr('rp.lv.total'), kind: 'number' },
        { key: 'used', label: tr('rp.lv.used'), kind: 'number' },
        { key: 'remaining', label: tr('rp.lv.remaining'), kind: 'number' },
        { key: 'usage', label: tr('rp.lv.usage'), kind: 'percent' },
      ],
      rows,
      summary: [{ label: tr('rp.hub.stat.people'), value: new Set(rows.map((r) => r.employee)).size }, { label: tr('rp.lv.sumUsed'), value: sum(rows.map((r) => r.used)) }, { label: tr('rp.lv.sumRemaining'), value: sum(rows.map((r) => r.remaining)) }, { label: tr('rp.lv.low'), value: rows.filter((r) => r.remaining <= 3).length }],
      chartTitle: tr('rp.lv.chart'),
      chart: [...byType].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      chartKind: 'number',
    }
  }

  if (kind === 'tasks') {
    const rows = rowsOf.map((row) => {
      const mine = tasks.filter((task) => assignments.some((item) => item.task_id === task.task_id && item.user_id === row.user.user_id) && task.created_at.slice(0, 10) >= filters.from && task.created_at.slice(0, 10) <= filters.to)
      const count = (status: string) => mine.filter((task) => task.task_status === status).length
      const done = count('completed')
      return { employee: row.name, department: row.department?.department_name ?? '—', total: mine.length, todo: count('to-do'), progress: count('in_progress'), done, cancelled: count('cancelled'), overdue: mine.filter((task) => isOverdue(task)).length, rate: mine.length ? round((done / mine.length) * 100) : 0 }
    }).filter((r) => r.total > 0)
    return {
      title: tr('rp.tk.title'),
      columns: [
        { key: 'employee', label: tr('rp.att.employee'), kind: 'text' },
        { key: 'department', label: tr('rp.att.department'), kind: 'text' },
        { key: 'total', label: tr('rp.tk.total'), kind: 'number' },
        { key: 'todo', label: tr('rp.tk.todo'), kind: 'number' },
        { key: 'progress', label: tr('rp.tk.progress'), kind: 'number' },
        { key: 'done', label: tr('rp.tk.done'), kind: 'number' },
        { key: 'cancelled', label: tr('rp.tk.cancelled'), kind: 'number' },
        { key: 'overdue', label: tr('rp.tk.overdue'), kind: 'number' },
        { key: 'rate', label: tr('rp.tk.rate'), kind: 'percent' },
      ],
      rows,
      summary: [{ label: tr('rp.tk.total'), value: sum(rows.map((r) => r.total)) }, { label: tr('rp.tk.done'), value: sum(rows.map((r) => r.done)) }, { label: tr('rp.tk.overdue'), value: sum(rows.map((r) => r.overdue)) }],
      chartTitle: tr('rp.tk.chart'),
      chart: rows.map((r) => ({ label: r.employee, value: r.rate })).sort((a, c) => c.value - a.value).slice(0, 8),
      chartMax: 100,
      chartKind: 'percent',
    }
  }

  if (kind === 'recruitment') {
    const list = applications.filter((item) => item.submission_date.slice(0, 10) >= filters.from && item.submission_date.slice(0, 10) <= filters.to)
    const positions = [...new Set(list.map((item) => item.applied_position))]
    const rows = positions.map((position) => {
      const mine = list.filter((item) => item.applied_position === position)
      const count = (status: string) => mine.filter((item) => item.application_status === status).length
      return { position, total: mine.length, pending: count('pending'), shortlisted: count('shortlisted'), interview: count('interview_scheduled'), accepted: count('accepted'), rejected: count('rejected') }
    })
    return {
      title: tr('rp.rc.title'),
      columns: [
        { key: 'position', label: tr('rp.rc.position'), kind: 'text' },
        { key: 'total', label: tr('rp.tk.total'), kind: 'number' },
        { key: 'pending', label: tr('rp.rc.pending'), kind: 'number' },
        { key: 'shortlisted', label: tr('rp.rc.shortlisted'), kind: 'number' },
        { key: 'interview', label: tr('rp.rc.interview'), kind: 'number' },
        { key: 'accepted', label: tr('rp.rc.accepted'), kind: 'number' },
        { key: 'rejected', label: tr('rp.rc.rejected'), kind: 'number' },
      ],
      rows,
      summary: [{ label: tr('rp.tk.total'), value: sum(rows.map((r) => r.total)) }, { label: tr('rp.rc.accepted'), value: sum(rows.map((r) => r.accepted)) }, { label: tr('rp.rc.rejected'), value: sum(rows.map((r) => r.rejected)) }],
      chartTitle: tr('rp.rc.chart'),
      chart: rows.map((r) => ({ label: r.position, value: r.total })).sort((a, c) => c.value - a.value),
      chartKind: 'number',
    }
  }

  if (kind === 'payroll') {
    const list = payrolls.filter((p) => ids.has(p.user_id) && p.salary_month >= `${filters.from.slice(0, 7)}-01` && p.salary_month <= filters.to)
    const rows = rowsOf.map((row) => {
      const mine = list.filter((p) => p.user_id === row.user.user_id)
      return { employee: row.name, department: row.department?.department_name ?? '—', months: mine.length, basic: round(sum(mine.map((p) => p.basic_salary))), bonuses: round(sum(mine.map((p) => p.bonuses))), deductions: round(sum(mine.map((p) => p.deductions))), net: round(sum(mine.map((p) => p.net_salary))) }
    }).filter((r) => r.months > 0)
    const byMonth = new Map<string, number>()
    for (const p of list) byMonth.set(p.salary_month, (byMonth.get(p.salary_month) ?? 0) + p.net_salary)
    return {
      title: tr('rp.pay.title'),
      columns: [
        { key: 'employee', label: tr('rp.att.employee'), kind: 'text' },
        { key: 'department', label: tr('rp.att.department'), kind: 'text' },
        { key: 'months', label: tr('rp.pay.months'), kind: 'number' },
        { key: 'basic', label: tr('rp.pay.basic'), kind: 'money' },
        { key: 'bonuses', label: tr('rp.pay.bonuses'), kind: 'money' },
        { key: 'deductions', label: tr('rp.pay.deductions'), kind: 'money' },
        { key: 'net', label: tr('rp.pay.net'), kind: 'money' },
      ],
      rows,
      summary: [{ label: tr('rp.hub.stat.people'), value: rows.length }, { label: tr('rp.pay.sumNet'), value: round(sum(rows.map((r) => r.net))), kind: 'money' }, { label: tr('rp.pay.sumBonus'), value: round(sum(rows.map((r) => r.bonuses))), kind: 'money' }, { label: tr('rp.pay.sumDed'), value: round(sum(rows.map((r) => r.deductions))), kind: 'money' }],
      chartTitle: tr('rp.pay.chart'),
      chart: [...byMonth].sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value: round(value) })),
      chartKind: 'money',
    }
  }

  const list = reviews.filter((r) => ids.has(r.reviewed_user_id) && r.review_status === 'submitted' && (r.submitted_at ?? '').slice(0, 10) >= filters.from && (r.submitted_at ?? '').slice(0, 10) <= filters.to)
  const rows = list.map((r) => {
    const row = rowsOf.find((item) => item.user.user_id === r.reviewed_user_id)!
    return { employee: row.name, department: row.department?.department_name ?? '—', plan: getPlan(r.plan_id)?.plan_name ?? '—', score: r.final_percentage ?? 0, rating: ratingLabel(r.final_percentage).label }
  })
  const avg = rows.length ? round(sum(rows.map((r) => r.score)) / rows.length) : 0
  return {
    title: tr('rp.pf.title'),
    columns: [
      { key: 'employee', label: tr('rp.att.employee'), kind: 'text' },
      { key: 'department', label: tr('rp.att.department'), kind: 'text' },
      { key: 'plan', label: tr('rp.pf.plan'), kind: 'text' },
      { key: 'score', label: tr('rp.pf.score'), kind: 'percent' },
      { key: 'rating', label: tr('rp.pf.rating'), kind: 'badge' },
    ],
    rows,
    summary: [{ label: tr('rp.pf.count'), value: rows.length }, { label: tr('rp.pf.avg'), value: avg, kind: 'percent' }, { label: tr('rp.pf.top'), value: rows.length ? Math.max(...rows.map((r) => r.score)) : 0, kind: 'percent' }],
    chartTitle: tr('rp.pf.chart'),
    chart: rows.map((r) => ({ label: r.employee, value: r.score })).sort((a, b) => b.value - a.value).slice(0, 8),
    chartMax: 100,
    chartKind: 'percent',
  }
}
