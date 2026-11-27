import { tr, type TKey } from '@/i18n'
import type {
  ActivityAction,
  AttendanceStatus,
  EmploymentType,
  PaymentType,
  PlanStatus,
  RecruitmentStatus,
  RepaymentStatus,
  RequestStatus,
  RequestType,
  Role,
  TaskPriority,
  TaskStatus,
} from '@/types/entities'

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

export interface Label {
  label: string
  tone: Tone
}

function labelMap<K extends string>(entries: Record<K, [TKey, Tone]>): Record<K, Label> {
  const out = {} as Record<K, Label>
  for (const name of Object.keys(entries) as K[]) {
    const [key, tone] = entries[name]
    Object.defineProperty(out, name, { enumerable: true, get: () => ({ label: tr(key), tone }) })
  }
  return out
}

function textMap<K extends string>(entries: Record<K, TKey>): Record<K, string> {
  const out = {} as Record<K, string>
  for (const name of Object.keys(entries) as K[]) {
    Object.defineProperty(out, name, { enumerable: true, get: () => tr(entries[name]) })
  }
  return out
}

export const roleLabels: Record<Role, Label> = labelMap({
  hr_admin: ['role.hr_admin', 'brand'],
  manager: ['role.manager', 'info'],
  employee: ['role.employee', 'neutral'],
})

export const attendanceStatusLabels: Record<AttendanceStatus, Label> = labelMap({
  present: ['status.present', 'success'],
  late: ['status.late', 'warning'],
  absent: ['status.absent', 'danger'],
  on_leave: ['status.on_leave', 'info'],
})

export const employmentTypeLabels: Record<EmploymentType, string> = textMap({
  full_time: 'emp.full_time',
  part_time: 'emp.part_time',
  contract: 'emp.contract',
})

export const requestTypeLabels: Record<RequestType, string> = textMap({
  leave: 'rtype.leave',
  loan: 'rtype.loan',
  permission: 'rtype.permission',
  custom: 'rtype.custom',
})

export const requestStatusLabels: Record<RequestStatus, Label> = labelMap({
  pending: ['rstatus.pending', 'warning'],
  approved: ['rstatus.approved', 'success'],
  rejected: ['rstatus.rejected', 'danger'],
})

export const paymentTypeLabels: Record<PaymentType, string> = textMap({
  paid: 'pay.paid',
  half_paid: 'pay.half_paid',
  unpaid: 'pay.unpaid',
})

export const recruitmentStatusLabels: Record<RecruitmentStatus, Label> = labelMap({
  pending: ['rec.pending', 'brand'],
  shortlisted: ['rec.shortlisted', 'info'],
  interview_scheduled: ['rec.interview_scheduled', 'warning'],
  accepted: ['rec.accepted', 'success'],
  rejected: ['rec.rejected', 'danger'],
})

export const taskPriorityLabels: Record<TaskPriority, Label> = labelMap({
  low: ['prio.low', 'neutral'],
  medium: ['prio.medium', 'warning'],
  high: ['prio.high', 'danger'],
})

export const taskStatusLabels: Record<TaskStatus, Label> = labelMap({
  'to-do': ['tstatus.to-do', 'neutral'],
  in_progress: ['tstatus.in_progress', 'brand'],
  completed: ['tstatus.completed', 'success'],
  cancelled: ['tstatus.cancelled', 'danger'],
})

export const activityActionLabels: Record<ActivityAction, Label> = labelMap({
  create: ['log.create', 'success'],
  update: ['log.update', 'brand'],
  delete: ['log.delete', 'danger'],
})

export const repaymentStatusLabels: Record<RepaymentStatus, Label> = labelMap({
  pending: ['repay.pending', 'warning'],
  paid: ['repay.paid', 'success'],
})

export const planStatusLabels: Record<PlanStatus, Label> = labelMap({
  draft: ['plan.draft', 'neutral'],
  active: ['plan.active', 'success'],
  closed: ['plan.closed', 'info'],
})
