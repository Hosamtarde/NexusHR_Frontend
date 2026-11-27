import { requestTypeLabels } from '@/lib/labels'
import { tr } from '@/i18n'
import { daysBetween, formatDate, formatMoney, formatShortDate } from '@/lib/format'
import type { HrRequest } from '@/types/entities'
import { getLeaveType } from '@/features/leave/data'

export function requestTitle(request: HrRequest) {
  if (request.request_type === 'leave') return getLeaveType(request.leave_type_id)?.type_name ?? requestTypeLabels.leave
  if (request.request_type === 'custom') return request.request_title ?? requestTypeLabels.custom
  return requestTypeLabels[request.request_type]
}

export function requestSummary(request: HrRequest) {
  if (request.request_type === 'loan') return tr('req.loanSummary', { amount: formatMoney(request.loan_amount), n: request.repayment_period ?? 0 })
  if (request.start_date && request.end_date) {
    if (request.start_date === request.end_date) return formatDate(request.start_date)
    return `${formatShortDate(request.start_date)} – ${formatShortDate(request.end_date)} (${tr('req.days', { n: daysBetween(request.start_date, request.end_date) })})`
  }
  return request.reason
}
