import { useViewer } from '@/app/viewer-context'
import { HrDashboard } from './HrDashboard'
import { EmployeeDashboard, ManagerDashboard } from './RoleDashboards'

export function DashboardPage() {
  const { role } = useViewer()
  if (role === 'hr_admin') return <HrDashboard />
  return role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />
}
