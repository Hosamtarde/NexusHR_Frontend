import type { Payroll } from '@/types/entities'
import { activeEmployees } from '@/features/employees/data'
import { seeded } from '@/lib/dates'

export const payrollMonths = ['2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01']

function build(): Payroll[] {
  const list: Payroll[] = []
  let id = 1
  for (const month of payrollMonths) {
    for (const row of activeEmployees()) {
      const random = seeded(row.user.user_id * 17 + Number(month.slice(5, 7)) * 389)
      const basic = row.profile.basic_salary
      const bonuses = random() > 0.7 ? Math.round(random() * 6) * 100 : 0
      let deductions = 0
      if (row.user.user_id === 5 && month >= '2026-07-01') deductions += 400
      if (random() > 0.92) deductions += Math.round((basic / 30) * 100) / 100
      list.push({
        payroll_id: id++,
        user_id: row.user.user_id,
        basic_salary: basic,
        bonuses,
        deductions: Math.round(deductions * 100) / 100,
        net_salary: Math.round((basic + bonuses - deductions) * 100) / 100,
        salary_month: month,
        generated_at: `${month.slice(0, 8)}28T09:00:00Z`,
      })
    }
  }
  return list
}

export const payrolls = build()

export const getPayroll = (id: number) => payrolls.find((item) => item.payroll_id === id) ?? null

export const payrollsOf = (userId: number) =>
  payrolls.filter((item) => item.user_id === userId).sort((a, b) => b.salary_month.localeCompare(a.salary_month))

export function runSummaries() {
  const months = [...new Set(payrolls.map((item) => item.salary_month))].sort((a, b) => b.localeCompare(a))
  return months.map((month) => {
    const list = payrolls.filter((item) => item.salary_month === month)
    const sum = (pick: (item: Payroll) => number) => Math.round(list.reduce((total, item) => total + pick(item), 0) * 100) / 100
    return { month, count: list.length, basic: sum((p) => p.basic_salary), bonuses: sum((p) => p.bonuses), deductions: sum((p) => p.deductions), net: sum((p) => p.net_salary), generatedAt: list[0]?.generated_at ?? '' }
  })
}

export const payrollsInMonth = (month: string) => payrolls.filter((item) => item.salary_month === month)

export const nextRunMonth = () => {
  const last = payrollMonths[payrollMonths.length - 1]!
  const known = payrolls.reduce((max, item) => (item.salary_month > max ? item.salary_month : max), last)
  const [year, month] = known.split('-').map(Number) as [number, number]
  return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
}

export function previewRun() {
  return activeEmployees().map((row) => {
    const basic = row.profile.basic_salary
    return { userId: row.user.user_id, basic }
  })
}

export const hasPayroll = (userId: number, month: string) => payrolls.some((item) => item.user_id === userId && item.salary_month === month)

export function createPayrolls(month: string, bonus: number, loanByUser: Record<number, number>, onlyUser: number | null) {
  let id = Math.max(0, ...payrolls.map((item) => item.payroll_id)) + 1
  const created: Payroll[] = []
  let skipped = 0
  for (const line of previewRun()) {
    if (onlyUser !== null && line.userId !== onlyUser) continue
    if (hasPayroll(line.userId, month)) {
      skipped++
      continue
    }
    const deductions = Math.round((loanByUser[line.userId] ?? 0) * 100) / 100
    const record: Payroll = { payroll_id: id++, user_id: line.userId, basic_salary: line.basic, bonuses: bonus, deductions, net_salary: Math.round((line.basic + bonus - deductions) * 100) / 100, salary_month: month, generated_at: new Date().toISOString() }
    payrolls.push(record)
    created.push(record)
  }
  return { created, skipped }
}

export function updatePayroll(id: number, bonuses: number, deductions: number) {
  const item = payrolls.find((entry) => entry.payroll_id === id)
  if (!item) return
  item.bonuses = Math.round(bonuses * 100) / 100
  item.deductions = Math.round(deductions * 100) / 100
  item.net_salary = Math.round((item.basic_salary + item.bonuses - item.deductions) * 100) / 100
}

export function deletePayroll(id: number) {
  const index = payrolls.findIndex((entry) => entry.payroll_id === id)
  if (index >= 0) payrolls.splice(index, 1)
}
