import type { NotificationType } from '@/types/entities'
import type { Localized, TKey } from '@/i18n'

export type Person = number | Localized

export interface NotifParams {
  actor?: Person
  subject?: Person
  kind?: TKey
  status?: TKey
  decision?: TKey
  title?: Localized
  n?: number
  when?: string
}

export interface StoredNotification {
  notification_id: number
  user_id: number
  type: NotificationType
  params: NotifParams
  link: string | null
  is_read: boolean
  created_at: string
}

type Seed = [type: NotificationType, params: NotifParams, link: string | null, hoursAgo: number, read: boolean]

const now = Date.now()
const hours = (value: number) => new Date(now - value * 3600 * 1000).toISOString()

const hrSeeds: Seed[] = [
  ['request_submitted', { actor: 5, kind: 'rtype.leave' }, '/requests/41', 1, false],
  ['interview_scheduled', { actor: { ar: 'ملك الصالحي', en: 'Malak Al-Salhi' }, title: { ar: 'محاسب أول', en: 'Senior Accountant' }, when: new Date(now + 3 * 3600 * 1000).toISOString() }, '/recruitment/12', 2, false],
  ['request_submitted', { actor: 11, kind: 'rtype.loan' }, '/requests/43', 5, false],
  ['application_status', { actor: { ar: 'عبد الرحمن الشلالدة', en: 'Abdulrahman Al-Shalalda' }, title: { ar: 'مطوّر خلفيات', en: 'Backend Developer' } }, '/recruitment/15', 9, true],
  ['review_submitted', { actor: 2, subject: 6 }, '/performance/reviews/7', 26, true],
  ['task_completed', { actor: 7, title: { ar: 'ترقية خوادم البريد', en: 'Upgrade the mail servers' } }, '/tasks/3', 30, true],
  ['payslip_generated', { title: { ar: 'أكتوبر 2026', en: 'October 2026' } }, '/payroll', 290, true],
  ['manager_changed', { actor: 1 }, '/org-chart/me', 400, true],
]

const managerSeeds: Seed[] = [
  ['request_submitted', { actor: 5, kind: 'rtype.leave' }, '/requests/41', 1, false],
  ['review_pending', { n: 4, title: { ar: 'خطة تقييم الربع الرابع', en: 'Q4 evaluation plan' } }, '/performance/reviews', 4, false],
  ['task_due_soon', { n: 2, title: { ar: 'توثيق واجهات البرمجة', en: 'Document the APIs' } }, '/tasks/2', 20, false],
  ['task_status_changed', { actor: 19, title: { ar: 'اختبار نظام الحضور', en: 'Test the attendance system' }, status: 'tstatus.in_progress' }, '/tasks/5', 28, true],
  ['payslip_generated', { title: { ar: 'أكتوبر 2026', en: 'October 2026' } }, '/payroll/me', 290, true],
]

const employeeSeeds: Seed[] = [
  ['task_assigned', { actor: 2, title: { ar: 'إعادة تصميم صفحة الحضور', en: 'Redesign the attendance page' } }, '/tasks/1', 2, false],
  ['request_reviewed', { actor: 2, kind: 'rtype.permission', decision: 'rstatus.approved' }, '/requests/38', 30, false],
  ['leave_balance_low', { n: 2, title: { ar: 'إجازة مرضية', en: 'Sick leave' } }, '/leave-balances/me', 72, true],
  ['payslip_generated', { title: { ar: 'أكتوبر 2026', en: 'October 2026' } }, '/payroll/me', 290, true],
  ['review_submitted', { actor: 2, subject: 5 }, '/performance/reviews/me', 500, true],
  ['loan_instalment_paid', { n: 4, title: { ar: 'أكتوبر', en: 'October' } }, '/payroll/me', 292, true],
  ['manager_changed', { actor: 2 }, '/org-chart/me', 900, true],
]

function build(userId: number, seeds: Seed[], offset: number): StoredNotification[] {
  return seeds.map(([type, params, link, hoursAgo, read], index) => ({
    notification_id: offset + index,
    user_id: userId,
    type,
    params,
    link,
    is_read: read,
    created_at: hours(hoursAgo),
  }))
}

export const seedNotifications: StoredNotification[] = [...build(1, hrSeeds, 100), ...build(2, managerSeeds, 200), ...build(5, employeeSeeds, 300)]
