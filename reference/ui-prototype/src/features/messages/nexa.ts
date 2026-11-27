import type { AssignedTask, HrRequest, LeaveBalance, Role, Task } from '@/types/entities'
import { NOW_TIME, TODAY } from '@/lib/dates'
import { payrollsOf } from '@/features/payroll/data'
import { remaining } from '@/features/leave/data'
import { reviewQueue } from '@/features/requests/data'
import type { AppRecord } from '@/features/recruitment/data'
import type { Answer } from './data'

export interface NexaContext {
  role: Role
  userId: number
  requests: HrRequest[]
  balances: LeaveBalance[]
  tasks: Task[]
  assignments: AssignedTask[]
  applications: AppRecord[]
}

const has = (text: string, pattern: RegExp) => pattern.test(text.toLowerCase())

export function answerFor(question: string, ctx: NexaContext): Answer {
  const q = question.trim()
  if (has(q, /^(مرحبا|مرحباً|اهلا|أهلا|السلام|hi\b|hello|hey)/)) return { intent: 'greeting' }
  if (has(q, /(مقابل|interview)/)) {
    const now = `${TODAY}T${NOW_TIME}`
    const items = ctx.applications
      .filter((item) => item.interview_at && item.interview_at >= now)
      .sort((a, b) => (a.interview_at ?? '').localeCompare(b.interview_at ?? ''))
      .slice(0, 3)
      .map((item) => ({ id: item.application_id, at: item.interview_at }))
    return { intent: 'interviews', data: items }
  }
  if (has(q, /(مهم|مهام|task)/)) {
    const items = ctx.assignments
      .filter((item) => item.user_id === ctx.userId && item.completion_percentage < 100)
      .map((item) => ctx.tasks.find((task) => task.task_id === item.task_id))
      .filter((task): task is Task => Boolean(task) && task!.task_status !== 'completed' && task!.task_status !== 'cancelled')
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 3)
      .map((task) => ({ id: task.task_id, deadline: task.deadline }))
    return { intent: 'tasks', data: items }
  }
  if (has(q, /(راتب|قسيم|رواتب|payslip|salary|payroll)/)) {
    const latest = payrollsOf(ctx.userId)[0]
    return latest ? { intent: 'payslip', data: { id: latest.payroll_id, month: latest.salary_month, net: latest.net_salary } } : { intent: 'notfound' }
  }
  if (has(q, /(رصيد|balance|remaining|كم يوم|how many days|vacation|إجاز|اجاز|leave)/) && !has(q, /(طلب|request)/)) {
    const items = ctx.balances.filter((item) => item.user_id === ctx.userId).map((item) => ({ typeId: item.leave_type_id, remaining: remaining(item), total: item.total_days + item.carried_over }))
    return { intent: 'balance', data: items }
  }
  if (has(q, /(طلب|request)/)) {
    const mine = ctx.requests.filter((item) => item.user_id === ctx.userId).sort((a, b) => b.created_at.localeCompare(a.created_at))
    const count = (status: string) => mine.filter((item) => item.request_status === status).length
    const waiting = ctx.role === 'employee' ? 0 : reviewQueue(ctx.role, ctx.userId, ctx.requests).length
    return { intent: 'requests', data: { pending: count('pending'), approved: count('approved'), rejected: count('rejected'), waiting, latest: mine.slice(0, 3).map((item) => item.request_id) } }
  }
  return { intent: 'notfound' }
}
