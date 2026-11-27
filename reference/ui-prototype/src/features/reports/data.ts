import type { Role } from '@/types/entities'
import { activeEmployees, departments, getProfile, teamIds, type EmployeeRow } from '@/features/employees/data'
import { attendance } from '@/features/attendance/data'
import { reviews } from '@/features/performance/data'
import { assignments, isOverdue, tasks } from '@/features/tasks/data'
import { requests } from '@/features/requests/data'
import { applications } from '@/features/recruitment/data'
import { TODAY } from '@/lib/dates'

export interface ReportScope {
  departmentIds: number[] | null
  userIds?: number[]
}

export function scopeFor(role: Role, userId: number): ReportScope {
  if (role === 'hr_admin') return { departmentIds: null }
  const ids = [userId, ...teamIds(userId)]
  const departmentIds = [...new Set(ids.map((id) => getProfile(id)?.department_id).filter((id): id is number => typeof id === 'number'))]
  return { departmentIds, userIds: ids }
}

export function people(scope: ReportScope, departmentId?: number): EmployeeRow[] {
  return activeEmployees().filter((row) => {
    const department = row.profile.department_id ?? -1
    if (scope.departmentIds && !scope.departmentIds.includes(department)) return false
    if (scope.userIds && !scope.userIds.includes(row.user.user_id)) return false
    if (departmentId && department !== departmentId) return false
    return true
  })
}

export const round = (value: number) => Math.round(value * 10) / 10

export interface DepartmentPulse {
  departmentId: number
  department: string
  employees: number
  presentToday: number
  presenceRate: number
  pendingRequests: number
  overdueTasks: number
  pendingReviews: number
}

export function dashboardData(scope: ReportScope) {
  const rows = people(scope)
  const pulse: DepartmentPulse[] = departments
    .filter((department) => !scope.departmentIds || scope.departmentIds.includes(department.department_id))
    .map((department) => {
      const members = rows.filter((row) => row.profile.department_id === department.department_id)
      const ids = new Set(members.map((row) => row.user.user_id))
      const present = attendance.filter(
        (record) => record.attendance_date === TODAY && ids.has(record.user_id) && (record.attendance_status === 'present' || record.attendance_status === 'late'),
      ).length
      const overdue = new Set(
        assignments
          .filter((item) => ids.has(item.user_id) && item.completion_percentage < 100)
          .map((item) => tasks.find((task) => task.task_id === item.task_id)!)
          .filter(isOverdue)
          .map((task) => `${task.task_id}`),
      ).size
      return {
        departmentId: department.department_id,
        department: department.department_name,
        employees: members.length,
        presentToday: present,
        presenceRate: members.length ? round((present / members.length) * 100) : 0,
        pendingRequests: requests.filter((request) => ids.has(request.user_id) && request.request_status === 'pending').length,
        overdueTasks: overdue,
        pendingReviews: reviews.filter((review) => ids.has(review.reviewed_user_id) && review.review_status === 'pending').length,
      }
    })
    .sort((a, b) => b.employees - a.employees)

  const total = (key: keyof Omit<DepartmentPulse, 'department' | 'departmentId' | 'presenceRate'>) =>
    pulse.reduce((sum, row) => sum + row[key], 0)

  return {
    pulse,
    totals: {
      employees: total('employees'),
      presentToday: total('presentToday'),
      pendingRequests: total('pendingRequests'),
      overdueTasks: total('overdueTasks'),
      pendingReviews: total('pendingReviews'),
      newApplications: scope.departmentIds ? null : applications.filter((item) => item.application_status === 'pending').length,
    },
  }
}
