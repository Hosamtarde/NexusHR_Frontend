import type { HrRequest, LoanRepayment, RequestStatus, RequestType, Role } from '@/types/entities'
import { teamIds } from '@/features/employees/data'
import { addDays } from '@/lib/dates'
import { localize } from '@/i18n/localized'
import { enRequestText } from './en'

type Seed = [
  id: number,
  user: number,
  type: RequestType,
  status: RequestStatus,
  created: string,
  details: Partial<HrRequest>,
]

const seeds: Seed[] = [
  [43, 11, 'loan', 'pending', '2026-11-12T05:10:00Z', { loan_amount: 3000, repayment_period: 10, reason: 'مصاريف علاج طارئة لأحد أفراد الأسرة.' }],
  [42, 16, 'permission', 'pending', '2026-11-11T13:40:00Z', { start_date: '2026-11-13', end_date: '2026-11-13', reason: 'مراجعة دائرة السير لتجديد رخصة القيادة، أحتاج ساعتين صباحًا.' }],
  [41, 5, 'leave', 'pending', '2026-11-12T08:20:00Z', { leave_type_id: 1, start_date: '2026-11-16', end_date: '2026-11-19', reason: 'سفر عائلي إلى عمّان.' }],
  [40, 6, 'custom', 'pending', '2026-11-10T09:00:00Z', { request_title: 'شهادة خبرة لجهة خارجية', reason: 'أحتاج شهادة خبرة باللغة الإنجليزية لتقديمها لبرنامج ماجستير.' }],
  [39, 12, 'leave', 'pending', '2026-11-09T10:30:00Z', { leave_type_id: 2, start_date: '2026-11-09', end_date: '2026-11-10', reason: 'التهاب حاد في الحلق، مرفق التقرير الطبي.', attachment: 'medical-report.pdf' }],
  [38, 5, 'permission', 'approved', '2026-11-03T07:00:00Z', { start_date: '2026-11-05', end_date: '2026-11-05', reason: 'موعد في السفارة.', reviewed_by: 2 }],
  [37, 8, 'leave', 'approved', '2026-11-01T11:00:00Z', { leave_type_id: 1, start_date: '2026-11-23', end_date: '2026-11-27', reason: 'إجازة زواج أخي.', reviewed_by: 3 }],
  [36, 10, 'leave', 'rejected', '2026-10-28T09:00:00Z', { leave_type_id: 1, start_date: '2026-11-02', end_date: '2026-11-06', reason: 'راحة شخصية.', reviewed_by: 4 }],
  [35, 17, 'loan', 'approved', '2026-10-20T08:15:00Z', { loan_amount: 2000, repayment_period: 8, reason: 'شراء سيارة مستعملة للتنقل إلى العمل.', reviewed_by: 1 }],
  [34, 7, 'leave', 'approved', '2026-10-15T12:00:00Z', { leave_type_id: 6, start_date: '2026-10-16', end_date: '2026-10-16', reason: 'ظرف عائلي طارئ.', reviewed_by: 2 }],
  [33, 19, 'custom', 'approved', '2026-10-12T10:00:00Z', { request_title: 'تعديل الحساب البنكي', reason: 'نقلت حسابي إلى بنك فلسطين، أرجو تحديث بيانات تحويل الراتب.', reviewed_by: 1 }],
  [32, 14, 'leave', 'approved', '2026-10-09T09:20:00Z', { leave_type_id: 2, start_date: '2026-11-12', end_date: '2026-11-13', reason: 'عملية جراحية بسيطة.', reviewed_by: 13 }],
  [31, 9, 'permission', 'rejected', '2026-10-05T08:00:00Z', { start_date: '2026-10-06', end_date: '2026-10-06', reason: 'مغادرة مبكرة.', reviewed_by: 3 }],
  [30, 22, 'leave', 'approved', '2026-09-28T08:00:00Z', { leave_type_id: 1, start_date: '2026-10-05', end_date: '2026-10-07', reason: 'امتحانات جامعية.', reviewed_by: 13 }],
  [29, 20, 'custom', 'approved', '2026-09-20T08:00:00Z', { request_title: 'دورة تدريبية في الضرائب', reason: 'طلب تسجيل في دورة قانون ضريبة الدخل المعدّل على حساب الشركة.', reviewed_by: 1 }],
  [28, 23, 'loan', 'rejected', '2026-09-14T08:00:00Z', { loan_amount: 9000, repayment_period: 6, reason: 'دفعة أولى لشقة.', reviewed_by: 1 }],
  [27, 2, 'leave', 'approved', '2026-09-02T08:00:00Z', { leave_type_id: 1, start_date: '2026-09-14', end_date: '2026-09-18', reason: 'إجازة سنوية.', reviewed_by: 1 }],
  [26, 6, 'leave', 'approved', '2026-08-18T08:00:00Z', { leave_type_id: 1, start_date: '2026-08-24', end_date: '2026-08-27', reason: 'سفر.', reviewed_by: 2 }],
  [25, 5, 'leave', 'approved', '2026-08-01T08:00:00Z', { leave_type_id: 2, start_date: '2026-08-03', end_date: '2026-08-05', reason: 'إنفلونزا.', reviewed_by: 2 }],
  [24, 13, 'permission', 'approved', '2026-07-21T08:00:00Z', { start_date: '2026-07-22', end_date: '2026-07-22', reason: 'اجتماع في مدرسة الأبناء.', reviewed_by: 1 }],
  [12, 5, 'loan', 'approved', '2026-06-10T08:00:00Z', { loan_amount: 2400, repayment_period: 6, reason: 'شراء حاسوب محمول للعمل والدراسة.', reviewed_by: 1 }],
]

export const requests: HrRequest[] = seeds.map(([id, user, type, status, created, details]) => {
  const base: HrRequest = {
  request_id: id,
  user_id: user,
  request_type: type,
  request_title: null,
  leave_type_id: null,
  start_date: null,
  end_date: null,
  loan_amount: null,
  repayment_period: null,
  reason: '',
  attachment: null,
  request_status: status,
  reviewed_by: null,
  created_at: created,
  ...details,
  }
  if (type === 'permission') Object.assign(base, { start_date: null, end_date: null })
  const en = enRequestText[id]
  if (!en) return base
  const fields: Record<string, { ar: string; en: string }> = { reason: { ar: base.reason, en: en.reason } }
  if (base.request_title) fields.request_title = { ar: base.request_title, en: en.title ?? base.request_title }
  return localize(base, fields)
})

export function requestsFor(userId: number, list: HrRequest[] = requests) {
  return list.filter((request) => request.user_id === userId)
}

export function reviewQueue(role: Role, userId: number, list: HrRequest[] = requests) {
  if (role === 'hr_admin') return list.filter((request) => request.request_status === 'pending')
  const team = teamIds(userId)
  return list.filter((request) => request.request_status === 'pending' && team.includes(request.user_id))
}

export function canReview(role: Role, userId: number, request: HrRequest) {
  if (request.request_status !== 'pending') return false
  if (role === 'hr_admin') return true
  if (request.user_id === userId) return false
  if (role === 'manager') return teamIds(userId).includes(request.user_id)
  return false
}

export function visibleRequests(role: Role, userId: number, list: HrRequest[] = requests) {
  if (role === 'hr_admin') return list
  if (role === 'manager') {
    const team = teamIds(userId)
    return list.filter((request) => request.user_id === userId || team.includes(request.user_id))
  }
  return requestsFor(userId, list)
}

function buildRepayments(): LoanRepayment[] {
  const list: LoanRepayment[] = []
  let id = 1
  for (const request of requests) {
    if (request.request_type !== 'loan' || request.request_status !== 'approved') continue
    const count = request.repayment_period ?? 1
    const amount = Math.round(((request.loan_amount ?? 0) / count) * 100) / 100
    const firstDue = request.request_id === 12 ? '2026-07-28' : '2026-11-28'
    for (let index = 0; index < count; index++) {
      const due = addDays(firstDue, index * 30)
      const paid = due < '2026-11-12'
      list.push({
        repayment_id: id++,
        request_id: request.request_id,
        installment_no: index + 1,
        due_date: due,
        amount,
        repayment_status: paid ? 'paid' : 'pending',
        paid_at: paid ? `${due}T10:00:00Z` : null,
        payroll_id: null,
      })
    }
  }
  return list
}

export const loanRepayments = buildRepayments()

export const repaymentsFor = (requestId: number) => loanRepayments.filter((item) => item.request_id === requestId)

export const monthlyInstallment = (amount: number, months: number) => (months > 0 ? Math.round((amount / months) * 100) / 100 : 0)

export function ensureSchedule(request: HrRequest) {
  const existing = repaymentsFor(request.request_id)
  if (existing.length || request.request_type !== 'loan' || request.request_status !== 'approved') return existing
  const count = request.repayment_period ?? 1
  const amount = monthlyInstallment(request.loan_amount ?? 0, count)
  let id = Math.max(0, ...loanRepayments.map((item) => item.repayment_id)) + 1
  for (let index = 0; index < count; index++) {
    loanRepayments.push({ repayment_id: id++, request_id: request.request_id, installment_no: index + 1, due_date: addDays('2026-11-28', index * 30), amount, repayment_status: 'pending', paid_at: null, payroll_id: null })
  }
  return repaymentsFor(request.request_id)
}

export function markInstallmentPaid(repaymentId: number) {
  const item = loanRepayments.find((entry) => entry.repayment_id === repaymentId)
  if (item && item.repayment_status !== 'paid') {
    item.repayment_status = 'paid'
    item.paid_at = new Date().toISOString()
  }
  return item ?? null
}
