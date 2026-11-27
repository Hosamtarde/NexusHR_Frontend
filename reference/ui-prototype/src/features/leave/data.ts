import type { LeaveBalance, LeaveType } from '@/types/entities'
import { activeEmployees } from '@/features/employees/data'
import { seeded } from '@/lib/dates'
import { localize } from '@/i18n/localized'

const leaveTypeSeeds: LeaveType[] = [
  { leave_type_id: 1, type_name: 'إجازة سنوية', payment_type: 'paid', default_days: 14, uses_service_tiers: true, created_at: '2025-01-01T08:00:00.000Z' },
  { leave_type_id: 2, type_name: 'إجازة مرضية', payment_type: 'paid', default_days: 14, uses_service_tiers: false, created_at: '2025-01-01T08:00:00.000Z' },
  { leave_type_id: 3, type_name: 'إجازة أمومة', payment_type: 'paid', default_days: 70, uses_service_tiers: false, created_at: '2025-01-01T08:00:00.000Z' },
  { leave_type_id: 4, type_name: 'إجازة بدون راتب', payment_type: 'unpaid', default_days: 30, uses_service_tiers: false, created_at: '2025-01-01T08:00:00.000Z' },
  { leave_type_id: 5, type_name: 'إجازة حج', payment_type: 'paid', default_days: 10, uses_service_tiers: false, created_at: '2025-03-12T08:00:00.000Z' },
  { leave_type_id: 6, type_name: 'إجازة طارئة', payment_type: 'half_paid', default_days: 3, uses_service_tiers: false, created_at: '2025-06-20T08:00:00.000Z' },
]

const enLeaveTypes: Record<number, string> = { 1: 'Annual leave', 2: 'Sick leave', 3: 'Maternity leave', 4: 'Unpaid leave', 5: 'Hajj leave', 6: 'Emergency leave' }

export const leaveTypes: LeaveType[] = leaveTypeSeeds.map((type) =>
  localize(type, { type_name: { ar: type.type_name, en: enLeaveTypes[type.leave_type_id] ?? type.type_name } }),
)

export const getLeaveType = (id: number | null | undefined) => leaveTypes.find((type) => type.leave_type_id === id) ?? null

const trackedTypes = [1, 2, 6]

function build(): LeaveBalance[] {
  const list: LeaveBalance[] = []
  let id = 1
  for (const row of activeEmployees()) {
    const years = 2026 - Number(row.profile.hire_date.slice(0, 4))
    for (const typeId of trackedTypes) {
      const type = getLeaveType(typeId)!
      const random = seeded(row.user.user_id * 31 + typeId * 997)
      const total = typeId === 1 ? type.default_days + (years >= 5 ? 7 : years >= 3 ? 4 : 0) : type.default_days
      const carried = typeId === 1 ? Math.floor(random() * 5) : 0
      let used = Math.floor(random() * (total * 0.85))
      if (row.user.user_id === 5 && typeId === 2) used = 12
      list.push({
        balance_id: id++,
        user_id: row.user.user_id,
        leave_type_id: typeId,
        year: 2026,
        total_days: total,
        carried_over: carried,
        used_days: used,
        is_manual: row.user.user_id === 9 && typeId === 1,
      })
    }
  }
  return list
}

export const leaveBalances = build()

export const remaining = (balance: LeaveBalance) => balance.total_days + balance.carried_over - balance.used_days

export const balancesFor = (userId: number) => leaveBalances.filter((balance) => balance.user_id === userId)

export const LOW_BALANCE_THRESHOLD = 3
