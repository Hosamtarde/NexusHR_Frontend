import { useSyncExternalStore } from 'react'
import type { RecruitmentStatus } from '@/types/entities'
import { applications as seedApplications, makeApplication, nextStatuses, updateApplication, type AppRecord } from '@/features/recruitment/data'
import type { AssignedTask, HrRequest, LeaveBalance, LeaveType, NotificationType, RequestStatus, Task, TaskPriority, TaskStatus } from '@/types/entities'
import { assignments as seedAssignments, tasks as seedTasks } from '@/features/tasks/data'
import { leaveBalances, leaveTypes as seedLeaveTypes } from '@/features/leave/data'
import { daysBetween } from '@/lib/format'
import { requests as seedRequests } from '@/features/requests/data'
import { seedNotifications, type NotifParams, type StoredNotification } from '@/features/notifications/data'
import { getProfile, users } from '@/features/employees/data'
import type { TKey } from '@/i18n'
import { bump } from './collections'
import { logActivity } from '@/features/settings/data'
import { applyPlanStatus, applyReview, getPlan, reopenReviewData } from '@/features/performance/data'
import { createPayrolls } from '@/features/payroll/data'
import { loanRepayments, markInstallmentPaid } from '@/features/requests/data'

interface AppState {
  requests: HrRequest[]
  notifications: StoredNotification[]
  balances: LeaveBalance[]
  leaveTypes: LeaveType[]
  tasks: Task[]
  assignments: AssignedTask[]
  applications: AppRecord[]
}

let state: AppState = { requests: [...seedRequests], notifications: [...seedNotifications], balances: [...leaveBalances], leaveTypes: [...seedLeaveTypes], tasks: [...seedTasks], assignments: [...seedAssignments], applications: [...seedApplications] }
let nextRequestId = Math.max(...seedRequests.map((request) => request.request_id)) + 1
let nextNotificationId = 1000
let nextApplicationId = Math.max(...seedApplications.map((item) => item.application_id)) + 1
let nextTaskId = Math.max(...seedTasks.map((task) => task.task_id)) + 1
const listeners = new Set<() => void>()

function commit(patch: Partial<AppState>) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useStore<T>(select: (value: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state))
}

function notification(userId: number, type: NotificationType, params: NotifParams, link: string | null): StoredNotification {
  return {
    notification_id: nextNotificationId++,
    user_id: userId,
    type,
    params,
    link,
    is_read: false,
    created_at: new Date().toISOString(),
  }
}

const kindOf = (request: HrRequest): TKey => `rtype.${request.request_type}`

export type RequestDraft = Pick<HrRequest, 'request_type' | 'request_title' | 'leave_type_id' | 'start_date' | 'end_date' | 'loan_amount' | 'repayment_period' | 'reason' | 'attachment'>

export function submitRequest(draft: RequestDraft, userId: number) {
  logActivity(userId, 'create', 'requests', nextRequestId, 'POST', '/requests')
  const request: HrRequest = {
    ...draft,
    request_id: nextRequestId++,
    user_id: userId,
    request_status: 'pending',
    reviewed_by: null,
    created_at: new Date().toISOString(),
  }
  const managerId = getProfile(userId)?.reports_to ?? null
  const hrIds = users.filter((user) => user.role === 'hr_admin' && user.status).map((user) => user.user_id)
  const recipients = [...new Set([...(managerId ? [managerId] : []), ...hrIds])].filter((id) => id !== userId)
  const link = `/requests/${request.request_id}`
  commit({
    requests: [request, ...state.requests],
    notifications: [...recipients.map((id) => notification(id, 'request_submitted', { actor: userId, kind: kindOf(request) }, link)), ...state.notifications],
  })
  return request
}

export function updateBalance(id: number, patch: Pick<LeaveBalance, 'total_days' | 'carried_over' | 'used_days'>, actorId: number) {
  logActivity(actorId, 'update', 'leave-balances', id, 'PUT', `/leave-balances/${id}`)
  commit({ balances: state.balances.map((item) => (item.balance_id === id ? { ...item, ...patch, is_manual: true } : item)) })
}

export function calculateBalances(year: number, actorId: number) {
  logActivity(actorId, 'create', 'leave-balances', null, 'POST', `/leave-balances/calculate?year=${year}`)
  let touched = 0
  const balances = state.balances.map((item) => {
    if (item.year !== year || item.is_manual) return item
    const type = state.leaveTypes.find((entry) => entry.leave_type_id === item.leave_type_id)
    if (!type || type.default_days === item.total_days) return item
    touched += 1
    return { ...item, total_days: type.default_days }
  })
  commit({ balances })
  return touched
}

export function removeRequest(requestId: number, actorId: number) {
  const target = state.requests.find((request) => request.request_id === requestId)
  if (!target || target.request_status !== 'pending') return false
  logActivity(actorId, 'delete', 'requests', requestId, 'DELETE', `/requests/${requestId}`)
  const managerId = getProfile(target.user_id)?.reports_to ?? null
  const hrIds = users.filter((user) => user.role === 'hr_admin' && user.status).map((user) => user.user_id)
  const recipients = [...new Set([...(managerId ? [managerId] : []), ...hrIds])].filter((id) => id !== actorId)
  commit({
    requests: state.requests.filter((request) => request.request_id !== requestId),
    notifications: [...recipients.map((id) => notification(id, 'request_cancelled', { actor: actorId, kind: kindOf(target) }, '/requests')), ...state.notifications],
  })
  return true
}

export function reviewRequest(requestId: number, decision: Exclude<RequestStatus, 'pending'>, reviewerId: number) {
  logActivity(reviewerId, 'update', 'requests', requestId, 'PUT', `/requests/${requestId}/review`)
  const target = state.requests.find((request) => request.request_id === requestId)
  if (!target || target.request_status !== 'pending') return () => undefined
  const updated = { ...target, request_status: decision, reviewed_by: reviewerId }
  const created = notification(target.user_id, 'request_reviewed', { actor: reviewerId, kind: kindOf(target), decision: `rstatus.${decision}` }, `/requests/${requestId}`)
  const previousBalances = state.balances
  const days = target.start_date && target.end_date ? daysBetween(target.start_date, target.end_date) : 0
  const balances =
    decision === 'approved' && target.request_type === 'leave'
      ? state.balances.map((item) => (item.user_id === target.user_id && item.leave_type_id === target.leave_type_id ? { ...item, used_days: item.used_days + days } : item))
      : state.balances
  commit({
    requests: state.requests.map((request) => (request.request_id === requestId ? updated : request)),
    notifications: [created, ...state.notifications],
    balances,
  })
  return () =>
    commit({
      requests: state.requests.map((request) => (request.request_id === requestId ? target : request)),
      notifications: state.notifications.filter((item) => item.notification_id !== created.notification_id),
      balances: previousBalances,
    })
}

export function markRead(id: number) {
  commit({
    notifications: state.notifications.map((item) => (item.notification_id === id ? { ...item, is_read: true } : item)),
  })
}

export function markAllRead(userId: number) {
  commit({ notifications: state.notifications.map((item) => (item.user_id === userId ? { ...item, is_read: true } : item)) })
}

export function removeNotification(id: number) {
  commit({ notifications: state.notifications.filter((item) => item.notification_id !== id) })
}

export function removeRead(userId: number) {
  commit({ notifications: state.notifications.filter((item) => item.user_id !== userId || !item.is_read) })
}

export function saveLeaveType(type: LeaveType) {
  const exists = state.leaveTypes.some((item) => item.leave_type_id === type.leave_type_id)
  commit({ leaveTypes: exists ? state.leaveTypes.map((item) => (item.leave_type_id === type.leave_type_id ? type : item)) : [...state.leaveTypes, type] })
}

export function removeLeaveType(id: number) {
  commit({ leaveTypes: state.leaveTypes.filter((item) => item.leave_type_id !== id) })
}

export const nextLeaveTypeId = () => Math.max(0, ...state.leaveTypes.map((item) => item.leave_type_id)) + 1

export interface TaskDraft {
  title: string
  description: string
  deadline: string
  priority: TaskPriority
}

export function createTask(draft: TaskDraft, assigneeIds: number[], byUserId: number) {
  logActivity(byUserId, 'create', 'tasks', nextTaskId, 'POST', '/tasks')
  const created = new Date().toISOString()
  const task: Task = {
    task_id: nextTaskId++,
    assigned_by: byUserId,
    task_title: draft.title,
    description: draft.description,
    deadline: draft.deadline,
    task_priority: draft.priority,
    task_status: 'to-do',
    created_at: created,
  }
  const alerts = assigneeIds
    .filter((id) => id !== byUserId)
    .map((id) => notification(id, 'task_assigned', { actor: byUserId, title: { ar: draft.title, en: draft.title } }, `/tasks/${task.task_id}`))
  commit({
    tasks: [task, ...state.tasks],
    assignments: [...assigneeIds.map((user_id) => ({ user_id, task_id: task.task_id, assigned_at: created, completion_percentage: 0 })), ...state.assignments],
    notifications: [...alerts, ...state.notifications],
  })
  return task
}

export function updateProgress(taskId: number, userId: number, percentage: number) {
  const task = state.tasks.find((item) => item.task_id === taskId)
  if (!task) return
  const assignments = state.assignments.map((item) => (item.task_id === taskId && item.user_id === userId ? { ...item, completion_percentage: percentage } : item))
  const mine = assignments.filter((item) => item.task_id === taskId)
  const done = percentage === 100 && mine.length > 0 && mine.every((item) => item.completion_percentage === 100)
  const alerts = done && task.assigned_by !== userId ? [notification(task.assigned_by, 'task_completed', { actor: userId, title: { ar: task.task_title, en: task.task_title } }, `/tasks/${taskId}`)] : []
  commit({ assignments, notifications: [...alerts, ...state.notifications] })
}

export function setTaskStatus(taskId: number, status: TaskStatus, actorId: number) {
  const task = state.tasks.find((item) => item.task_id === taskId)
  if (!task || task.task_status === status) return () => undefined
  const previous = task.task_status
  logActivity(actorId, 'update', 'tasks', taskId, 'PUT', `/tasks/${taskId}/status`)
  const recipients = [...new Set([...state.assignments.filter((item) => item.task_id === taskId).map((item) => item.user_id), task.assigned_by])].filter((id) => id !== actorId)
  const alerts = recipients.map((id) => notification(id, 'task_status_changed', { actor: actorId, title: { ar: task.task_title, en: task.task_title }, status: `tstatus.${status}` }, `/tasks/${taskId}`))
  commit({
    tasks: state.tasks.map((item) => (item.task_id === taskId ? { ...item, task_status: status } : item)),
    notifications: [...alerts, ...state.notifications],
  })
  return () => {
    commit({
      tasks: state.tasks.map((item) => (item.task_id === taskId ? { ...item, task_status: previous } : item)),
      notifications: state.notifications.filter((item) => !alerts.some((alert) => alert.notification_id === item.notification_id)),
    })
  }
}

export function updateTask(taskId: number, patch: { title: string; description: string; deadline: string; priority: TaskPriority }, actorId: number) {
  logActivity(actorId, 'update', 'tasks', taskId, 'PUT', `/tasks/${taskId}`)
  commit({
    tasks: state.tasks.map((item) => (item.task_id === taskId ? { ...item, task_title: patch.title, description: patch.description, deadline: patch.deadline, task_priority: patch.priority } : item)),
  })
}

export function removeTask(taskId: number, actorId: number) {
  const task = state.tasks.find((item) => item.task_id === taskId)
  if (!task) return
  logActivity(actorId, 'delete', 'tasks', taskId, 'DELETE', `/tasks/${taskId}`)
  commit({
    tasks: state.tasks.filter((item) => item.task_id !== taskId),
    assignments: state.assignments.filter((item) => item.task_id !== taskId),
  })
}

const hrUserIds = () => users.filter((user) => user.role === 'hr_admin' && user.status).map((user) => user.user_id)

export function submitApplication(form: { name: string; email: string; phone: string; position: string; cv: string }) {
  const position = { ar: form.position, en: form.position }
  const record = makeApplication(
    {
      application_id: nextApplicationId++,
      email: form.email,
      phone_number: form.phone || null,
      cv_file: form.cv,
      application_status: 'pending',
      interview_at: null,
      meeting_url: null,
      submission_date: new Date().toISOString(),
    },
    { ar: form.name, en: form.name },
    position,
  )
  const alerts = hrUserIds().map((id) => notification(id, 'application_status', { actor: { ar: form.name, en: form.name }, title: position }, `/recruitment/${record.application_id}`))
  commit({ applications: [record, ...state.applications], notifications: [...alerts, ...state.notifications] })
  return record
}

export function changeManager(userId: number, managerId: number | null, actorId: number) {
  const profile = getProfile(userId)
  if (!profile) return
  const previous = profile.reports_to
  logActivity(actorId, 'update', 'org-chart', userId, 'PUT', `/org-chart/${userId}/manager`)
  profile.reports_to = managerId
  bump('people')
  const recipients = [...new Set([userId, ...(managerId ? [managerId] : [])])].filter((id) => id !== actorId)
  const alerts = recipients.map((id) => notification(id, 'manager_changed', { actor: managerId ?? actorId }, id === userId ? '/org-chart/me' : '/org-chart?view=list'))
  void previous
  commit({ notifications: [...alerts, ...state.notifications] })
}

export function removeApplication(id: number, actorId: number) {
  logActivity(actorId, 'delete', 'recruitment', id, 'DELETE', `/recruitment/${id}`)
  commit({ applications: state.applications.filter((item) => item.application_id !== id) })
}

export function setApplicationStatus(id: number, status: RecruitmentStatus) {
  const current = state.applications.find((item) => item.application_id === id)
  if (!current || status === 'interview_scheduled' || !nextStatuses[current.application_status].includes(status)) return
  logActivity(1, 'update', 'recruitment', id, 'PUT', `/recruitment/${id}/status`)
  commit({ applications: state.applications.map((item) => (item.application_id === id ? updateApplication(item, { application_status: status }) : item)) })
}

export function scheduleInterview(id: number, at: string, actorId: number) {
  logActivity(actorId, 'update', 'recruitment', id, 'PUT', `/recruitment/${id}/interview`)
  const target = state.applications.find((item) => item.application_id === id)
  if (!target || (target.application_status !== 'shortlisted' && target.application_status !== 'interview_scheduled')) return
  const applicant = { ar: target.applicant_name, en: target.applicant_name }
  const url = target.meeting_url ?? `https://meet.jit.si/nexushr-${id}-${Math.random().toString(16).slice(2, 18)}`
  const recipients = hrUserIds().filter((user) => user !== actorId)
  const alerts = recipients.map((user) => notification(user, 'interview_scheduled', { actor: applicant, title: target.position_l, when: at }, '/recruitment/interviews'))
  commit({
    applications: state.applications.map((item) => (item.application_id === id ? updateApplication(item, { application_status: 'interview_scheduled', interview_at: at, meeting_url: url }) : item)),
    notifications: [...alerts, ...state.notifications],
  })
}

const monthTitle = (month: string) => ({ ar: new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'long', year: 'numeric' }).format(new Date(`${month}T00:00:00`)), en: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${month}T00:00:00`)) })

export function runPayroll(month: string, bonus: number, onlyUser: number | null) {
  logActivity(1, 'create', 'payroll', null, 'POST', '/payroll/generate')
  const loanByUser: Record<number, number> = {}
  const due = loanRepayments.filter((item) => item.repayment_status === 'pending' && item.due_date.slice(0, 7) === month.slice(0, 7))
  for (const item of due) {
    const owner = state.requests.find((request) => request.request_id === item.request_id)?.user_id
    if (owner !== undefined) loanByUser[owner] = (loanByUser[owner] ?? 0) + item.amount
  }
  const { created, skipped } = createPayrolls(month, bonus, loanByUser, onlyUser)
  const fresh = created.map((record) => notification(record.user_id, 'payslip_generated', { title: monthTitle(month) }, `/payroll/payslips/${record.payroll_id}`))
  for (const item of due) {
    const payroll = created.find((record) => state.requests.find((request) => request.request_id === item.request_id)?.user_id === record.user_id)
    markInstallmentPaid(item.repayment_id)
    if (payroll) item.payroll_id = payroll.payroll_id
  }
  commit({ notifications: [...fresh, ...state.notifications] })
  bump('payroll')
  bump('loans')
  return { generated: created.length, skipped }
}

export function submitReviewAction(reviewId: number, scores: Record<number, number>, notes: Record<number, string>, comment: string, actorId: number) {
  logActivity(actorId, 'update', 'performance-reviews', reviewId, 'PUT', `/performance/reviews/${reviewId}/submit`)
  const review = applyReview(reviewId, scores, notes, comment)
  if (!review) return
  const plan = getPlan(review.plan_id)
  const subject = review.reviewed_user_id
  const hrIds = users.filter((user) => user.role === 'hr_admin' && user.status && user.user_id !== actorId).map((user) => user.user_id)
  commit({ notifications: [...hrIds.map((id) => notification(id, 'review_submitted', { actor: actorId, subject, title: plan ? { ar: plan.plan_name, en: plan.plan_name } : undefined }, `/performance/reviews/${reviewId}`)), ...state.notifications] })
  bump('performance')
}

export function reopenReviewAction(reviewId: number, actorId: number) {
  logActivity(actorId, 'update', 'performance-reviews', reviewId, 'PATCH', `/performance/reviews/${reviewId}/reopen`)
  const review = reopenReviewData(reviewId)
  if (!review?.reviewed_by) return
  commit({ notifications: [notification(review.reviewed_by, 'review_reopened', { actor: actorId, subject: review.reviewed_user_id }, `/performance/reviews/${reviewId}/fill`), ...state.notifications] })
  bump('performance')
}

export function setPlanStatusAction(planId: number, status: 'draft' | 'active' | 'closed') {
  logActivity(1, 'update', 'evaluation-plans', planId, 'PATCH', `/performance/plans/${planId}/status`)
  const created = applyPlanStatus(planId, status)
  const plan = getPlan(planId)
  const byReviewer = new Map<number, number>()
  for (const review of created) if (review.reviewed_by) byReviewer.set(review.reviewed_by, (byReviewer.get(review.reviewed_by) ?? 0) + 1)
  const fresh = [...byReviewer].map(([id, n]) => notification(id, 'review_pending', { n, title: plan ? { ar: plan.plan_name, en: plan.plan_name } : undefined }, '/performance/reviews'))
  if (fresh.length) commit({ notifications: [...fresh, ...state.notifications] })
  bump('performance')
  return created.length
}
