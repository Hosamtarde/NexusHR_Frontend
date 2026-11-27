import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { LandingPage } from '@/features/auth/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForbiddenPage, NotFoundPage, RouteErrorPage, ServerErrorPage } from '@/features/system/ErrorPages'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { EmployeeCreatePage, EmployeeEditPage, EmployeeProfilePage, EmployeesPage } from '@/features/employees/EmployeePages'
import { EmployeeImportPage } from '@/features/employees/ImportPage'
import { DepartmentDetailPage, DepartmentsPage, TeamPage } from '@/features/employees/OrgPages'
import { OrgChartPage } from '@/features/employees/OrgChart'
import { AttendancePage, EmployeeAttendancePage } from '@/features/attendance/AttendancePages'
import { AllRequestsPage, MyRequestsPage, NewRequestPage, PendingRequestsPage, RequestDetailPage } from '@/features/requests/RequestPages'
import { LeaveBalancesPage, LeaveTypesPage, MyBalancePage } from '@/features/leave/LeavePages'
import { AllTasksPage, MyTasksPage, NewTaskPage, SmartAssignPage, TaskDetailPage, TeamTasksPage } from '@/features/tasks/TaskPages'
import { CareersPage } from '@/features/recruitment/CareersPage'
import { ApplicationDetailPage, ApplicationsPage, InterviewsPage, ScheduleInterviewPage } from '@/features/recruitment/RecruitmentPages'
import { MessagesPage } from '@/features/messages/rc/ChatPage'
import { MySkillsPage, SkillCatalogPage, SkillMatrixPage } from '@/features/skills/SkillPages'
import { MyPayslipsPage, PayrollRunDetailPage, PayrollRunsPage, PayrollRunWizardPage, AllPayslipsPage, PayslipPage } from '@/features/payroll/PayrollPages'
import { FillReviewPage, MyReviewsPage, ReviewDetailPage, ReviewsPage } from '@/features/performance/ReviewPages'
import { CategoriesPage, PlanDetailPage, PlanFormPage, PlansPage } from '@/features/performance/PlanPages'
import { ReportPage, ReportsHubPage } from '@/features/reports/ReportPages'
import { ActivityLogPage, UsersPage } from '@/features/settings/SettingsPages'
import { ChangePasswordPage, ProfilePage } from '@/features/settings/AccountPages'
import { RequireRole } from './RequireRole'
import { SessionGate } from './SessionGate'

const gate = (path: string, element: ReactNode) => <RequireRole path={path}>{element}</RequireRole>

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/careers', element: <CareersPage /> },
  { path: '/system/403', element: <ForbiddenPage standalone /> },
  { path: '/system/500', element: <ServerErrorPage standalone /> },
  { path: '/system/404', element: <NotFoundPage standalone /> },
  {
    path: '/',
    element: <SessionGate landing={<LandingPage />}><AppShell /></SessionGate>,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'messages/:id', element: <MessagesPage /> },

      { path: 'requests', element: <MyRequestsPage /> },
      { path: 'requests/new', element: <NewRequestPage /> },
      { path: 'requests/approvals', element: gate('/requests/approvals', <PendingRequestsPage />) },
      { path: 'requests/all', element: gate('/requests/all', <AllRequestsPage />) },
      { path: 'requests/:id', element: <RequestDetailPage /> },
      { path: 'recruitment', element: gate('/recruitment', <ApplicationsPage />) },
      { path: 'recruitment/interviews', element: gate('/recruitment/interviews', <InterviewsPage />) },
      { path: 'recruitment/:id', element: gate('/recruitment/:id', <ApplicationDetailPage />) },
      { path: 'recruitment/:id/schedule', element: gate('/recruitment/:id/schedule', <ScheduleInterviewPage />) },
      { path: 'tasks', element: gate('/tasks', <AllTasksPage />) },
      { path: 'tasks/mine', element: <MyTasksPage /> },
      { path: 'tasks/team', element: gate('/tasks/team', <TeamTasksPage />) },
      { path: 'tasks/new', element: gate('/tasks/new', <NewTaskPage />) },
      { path: 'tasks/smart', element: gate('/tasks/smart', <SmartAssignPage />) },
      { path: 'tasks/:id', element: <TaskDetailPage /> },
      { path: 'leave-balances', element: gate('/leave-balances', <LeaveBalancesPage />) },
      { path: 'leave-balances/me', element: <MyBalancePage /> },
      { path: 'leave-balances/types', element: gate('/leave-balances/types', <LeaveTypesPage />) },

      { path: 'employees', element: gate('/employees', <EmployeesPage />) },
      { path: 'employees/import', element: gate('/employees/import', <EmployeeImportPage />) },
      { path: 'employees/new', element: gate('/employees/new', <EmployeeCreatePage />) },
      { path: 'employees/skills', element: <SkillCatalogPage /> },
      { path: 'employees/skills/matrix', element: <SkillMatrixPage /> },
      { path: 'skills/me', element: <MySkillsPage /> },
      { path: 'employees/departments', element: gate('/employees/departments', <DepartmentsPage />) },
      { path: 'employees/departments/:id', element: gate('/employees/departments/:id', <DepartmentDetailPage />) },
      { path: 'employees/:id', element: gate('/employees/:id', <EmployeeProfilePage />) },
      { path: 'employees/:id/edit', element: gate('/employees/:id/edit', <EmployeeEditPage />) },
      { path: 'team', element: gate('/team', <TeamPage />) },
      { path: 'org-chart', element: <OrgChartPage /> },
      { path: 'org-chart/me', element: <OrgChartPage forceView="me" /> },
      { path: 'org-chart/:userId', element: <OrgChartPage /> },

      { path: 'payroll', element: gate('/payroll', <PayrollRunsPage />) },
      { path: 'payroll/run', element: gate('/payroll/run', <PayrollRunWizardPage />) },
      { path: 'payroll/runs/:month', element: gate('/payroll/runs/:month', <PayrollRunDetailPage />) },
      { path: 'payroll/payslips', element: gate('/payroll/payslips', <AllPayslipsPage />) },
      { path: 'payroll/payslips/:id', element: <PayslipPage /> },
      { path: 'payroll/me', element: <MyPayslipsPage /> },
      { path: 'performance/reviews', element: gate('/performance/reviews', <ReviewsPage />) },
      { path: 'performance/reviews/me', element: <MyReviewsPage /> },
      { path: 'performance/reviews/:id', element: <ReviewDetailPage /> },
      { path: 'performance/reviews/:id/fill', element: gate('/performance/reviews/:id/fill', <FillReviewPage />) },
      { path: 'performance/plans', element: gate('/performance/plans', <PlansPage />) },
      { path: 'performance/plans/new', element: gate('/performance/plans/new', <PlanFormPage />) },
      { path: 'performance/plans/:id', element: gate('/performance/plans/:id', <PlanDetailPage />) },
      { path: 'performance/plans/:id/edit', element: gate('/performance/plans/:id/edit', <PlanFormPage />) },
      { path: 'performance/categories', element: gate('/performance/categories', <CategoriesPage />) },
      { path: 'reports', element: gate('/reports', <ReportsHubPage />) },
      { path: 'reports/attendance', element: gate('/reports/attendance', <ReportPage kind="attendance" />) },
      { path: 'reports/leave', element: gate('/reports/leave', <ReportPage kind="leave" />) },
      { path: 'reports/payroll', element: gate('/reports/payroll', <ReportPage kind="payroll" />) },
      { path: 'reports/tasks', element: gate('/reports/tasks', <ReportPage kind="tasks" />) },
      { path: 'reports/recruitment', element: gate('/reports/recruitment', <ReportPage kind="recruitment" />) },
      { path: 'reports/performance', element: gate('/reports/performance', <ReportPage kind="performance" />) },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'attendance/employee/:id', element: gate('/attendance/employee/:id', <EmployeeAttendancePage />) },

      { path: 'admin/users', element: gate('/admin/users', <UsersPage />) },
      { path: 'admin/activity-logs', element: gate('/admin/activity-logs', <ActivityLogPage />) },
      { path: 'account/profile', element: <ProfilePage /> },
      { path: 'account/password', element: <ChangePasswordPage /> },
      { path: 'settings/users', element: <Navigate to="/admin/users" replace /> },
      { path: 'settings/activity-logs', element: <Navigate to="/admin/activity-logs" replace /> },
      { path: 'settings/leave-types', element: <Navigate to="/leave-balances/types" replace /> },
      { path: 'settings/profile', element: <Navigate to="/account/profile" replace /> },
      { path: 'settings/password', element: <Navigate to="/account/password" replace /> },
      { path: 'settings/*', element: <Navigate to="/" replace /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
