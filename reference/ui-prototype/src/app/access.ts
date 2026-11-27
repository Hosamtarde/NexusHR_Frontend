import type { Role } from '@/types/entities'

const hr: Role[] = ['hr_admin']
const staff: Role[] = ['hr_admin', 'manager']
const manager: Role[] = ['manager']

const rules: [string, Role[]][] = [
  ['/requests/approvals', staff],
  ['/requests/all', staff],
  ['/recruitment', hr],
  ['/recruitment/*', hr],
  ['/tasks', hr],
  ['/tasks/team', manager],
  ['/tasks/new', staff],
  ['/tasks/smart', staff],
  ['/leave-balances', hr],
  ['/leave-balances/types', hr],
  ['/employees', hr],
  ['/employees/new', hr],
  ['/employees/import', hr],
  ['/employees/skills', ['hr_admin', 'manager', 'employee']],
  ['/employees/departments', ['hr_admin', 'manager', 'employee']],
  ['/employees/departments/:id', ['hr_admin', 'manager', 'employee']],
  ['/employees/:id', hr],
  ['/employees/:id/edit', hr],
  ['/team', manager],
  ['/payroll', hr],
  ['/payroll/run', hr],
  ['/payroll/payslips', hr],
  ['/payroll/runs/:month', hr],
  ['/performance/reviews', staff],
  ['/performance/reviews/:id/fill', staff],
  ['/performance/plans', staff],
  ['/performance/plans/new', hr],
  ['/performance/plans/:id', staff],
  ['/performance/plans/:id/edit', hr],
  ['/performance/categories', staff],
  ['/reports', staff],
  ['/reports/attendance', staff],
  ['/reports/leave', staff],
  ['/reports/payroll', hr],
  ['/reports/performance', staff],
  ['/reports/tasks', staff],
  ['/reports/recruitment', hr],
  ['/attendance/employee/:id', staff],
  ['/admin/users', hr],
  ['/admin/activity-logs', hr],
]

const matcher = (pattern: string) => {
  const source = pattern
    .split('/')
    .map((part) => (part === '*' ? '.+' : part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/')
  return new RegExp(`^${source}/?$`)
}

const compiled = rules.map(([pattern, roles]) => ({ test: matcher(pattern), pattern, roles }))

export function rolesFor(path: string): Role[] | null {
  const clean = path.split('?')[0]!.split('#')[0]!
  const exact = compiled.filter((rule) => rule.test.test(clean))
  if (exact.length === 0) return null
  const weight = (pattern: string) => (pattern.includes('*') ? 2 : pattern.includes(':') ? 1 : 0)
  exact.sort((a, b) => weight(a.pattern) - weight(b.pattern) || b.pattern.length - a.pattern.length)
  return exact[0]!.roles
}

export function canAccess(role: Role, path: string) {
  const roles = rolesFor(path)
  return roles === null || roles.includes(role)
}
