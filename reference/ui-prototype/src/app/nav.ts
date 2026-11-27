import {
  Banknote,
  ChartColumn,
  CalendarCheck2,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Network,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Target,
  UserCog,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import type { TKey } from '@/i18n'
import type { Role } from '@/types/entities'
import { canAccess } from './access'

export interface Tab {
  label: TKey
  to: string
  roles?: Role[]
}

export interface NavItem {
  id: string
  label: TKey
  icon: LucideIcon
  to: string
  paths: string[]
  tabs?: Tab[]
  dot?: 'approvals' | 'messages'
  parent?: TKey
}

export interface NavGroup {
  label: TKey
  items: NavItem[]
}

const staff: Role[] = ['hr_admin', 'manager']
const hr: Role[] = ['hr_admin']

const dashboard: NavItem = { id: 'dashboard', label: 'nav.dashboard', icon: LayoutDashboard, to: '/', paths: ['/'] }

const messages: NavItem = { id: 'messages', label: 'nav.messages', icon: MessagesSquare, to: '/messages', paths: ['/messages'], dot: 'messages' }

const requestTabs: Tab[] = [
  { label: 'tab.pending', to: '/requests/approvals', roles: staff },
  { label: 'tab.myRequests', to: '/requests' },
  { label: 'tab.allRequests', to: '/requests/all', roles: hr },
  { label: 'tab.teamRequests', to: '/requests/all', roles: ['manager'] },
  { label: 'tab.leaveBalances', to: '/leave-balances', roles: hr },
  { label: 'tab.myBalance', to: '/leave-balances/me' },
  { label: 'tab.leaveTypes', to: '/leave-balances/types', roles: hr },
]

const items: Record<Role, { groups: NavGroup[] }> = {
  hr_admin: {
    groups: [
      {
        label: 'group.general',
        items: [
          dashboard,
          {
            id: 'employees',
            label: 'nav.employees',
            icon: Users,
            to: '/employees',
            paths: ['/employees', '/org-chart'],
            tabs: [
              { label: 'tab.list', to: '/employees' },
              { label: 'tab.departments', to: '/employees/departments' },
              { label: 'tab.orgChart', to: '/org-chart' },
              { label: 'tab.skills', to: '/employees/skills' },
              { label: 'tab.skillsMatrix', to: '/employees/skills/matrix' },
            ],
          },
          { id: 'attendance', label: 'nav.attendance', icon: CalendarCheck2, to: '/attendance', paths: ['/attendance'] },
          { id: 'requests', label: 'nav.requests', icon: FileText, to: '/requests/approvals', paths: ['/requests', '/leave-balances', '/leave-balances/types'], tabs: requestTabs, dot: 'approvals' },
        ],
      },
      {
        label: 'group.work',
        items: [
          {
            id: 'payroll',
            label: 'nav.payroll',
            icon: Banknote,
            to: '/payroll',
            paths: ['/payroll'],
            tabs: [
              { label: 'tab.payrollRuns', to: '/payroll' },
              { label: 'tab.payslips', to: '/payroll/payslips' },
              { label: 'nav.myPayslips', to: '/payroll/me' },
            ],
          },
          {
            id: 'tasks',
            label: 'nav.tasks',
            icon: ListChecks,
            to: '/tasks',
            paths: ['/tasks'],
            tabs: [
              { label: 'tab.allTasks', to: '/tasks' },
              { label: 'tab.myTasks', to: '/tasks/mine' },
              { label: 'tab.teamTasks', to: '/tasks/team' },
              { label: 'tab.smartAssign', to: '/tasks/smart' },
            ],
          },
          {
            id: 'performance',
            label: 'nav.performance',
            icon: Target,
            to: '/performance/reviews',
            paths: ['/performance'],
            tabs: [
              { label: 'tab.reviews', to: '/performance/reviews' },
              { label: 'tab.plans', to: '/performance/plans' },
              { label: 'tab.myReviews', to: '/performance/reviews/me' },
              { label: 'tab.categories', to: '/performance/categories' },
            ],
          },
          {
            id: 'recruitment',
            label: 'nav.recruitment',
            icon: UserCog,
            to: '/recruitment',
            paths: ['/recruitment'],
            tabs: [
              { label: 'tab.applications', to: '/recruitment' },
              { label: 'tab.interviews', to: '/recruitment/interviews' },
            ],
          },
        ],
      },
      {
        label: 'group.communication',
        items: [messages],
      },
      {
        label: 'group.insights',
        items: [
          {
            id: 'reports',
            label: 'nav.reports',
            icon: ChartColumn,
            to: '/reports',
            paths: ['/reports'],
            tabs: [
              { label: 'tab.overview', to: '/reports' },
              { label: 'tab.reportAttendance', to: '/reports/attendance' },
              { label: 'tab.reportLeave', to: '/reports/leave' },
              { label: 'tab.reportPayroll', to: '/reports/payroll' },
              { label: 'tab.reportPerformance', to: '/reports/performance' },
              { label: 'tab.reportTasks', to: '/reports/tasks' },
              { label: 'tab.reportRecruitment', to: '/reports/recruitment' },
            ],
          },
        ],
      },
      {
        label: 'group.admin',
        items: [
          { id: 'users', label: 'tab.users', icon: ShieldCheck, to: '/admin/users', paths: ['/admin/users'], parent: 'group.admin' },
          { id: 'activity', label: 'tab.activityLog', icon: ScrollText, to: '/admin/activity-logs', paths: ['/admin/activity-logs'], parent: 'group.admin' },
        ],
      },
    ],
  },
  manager: {
    groups: [
      {
        label: 'group.general',
        items: [
          dashboard,
          {
            id: 'team',
            label: 'nav.myTeam',
            icon: UsersRound,
            to: '/team',
            paths: ['/team', '/org-chart', '/employees'],
            tabs: [
              { label: 'tab.team', to: '/team' },
              { label: 'tab.departments', to: '/employees/departments' },
              { label: 'tab.orgChart', to: '/org-chart' },
              { label: 'tab.skillsMatrix', to: '/employees/skills/matrix' },
            ],
          },
          { id: 'attendance', label: 'nav.attendance', icon: CalendarCheck2, to: '/attendance', paths: ['/attendance'] },
          { id: 'requests', label: 'nav.requests', icon: FileText, to: '/requests/approvals', paths: ['/requests', '/leave-balances'], tabs: requestTabs, dot: 'approvals' },
        ],
      },
      {
        label: 'group.work',
        items: [
          {
            id: 'tasks',
            label: 'nav.tasks',
            icon: ListChecks,
            to: '/tasks/team',
            paths: ['/tasks'],
            tabs: [
              { label: 'tab.teamTasks', to: '/tasks/team' },
              { label: 'tab.myTasks', to: '/tasks/mine' },
              { label: 'tab.smartAssign', to: '/tasks/smart' },
            ],
          },
          { id: 'payroll', label: 'nav.myPayslips', icon: Banknote, to: '/payroll/me', paths: ['/payroll'] },
          {
            id: 'performance',
            label: 'nav.performance',
            icon: Target,
            to: '/performance/reviews',
            paths: ['/performance'],
            tabs: [
              { label: 'tab.reviews', to: '/performance/reviews' },
              { label: 'tab.myReviews', to: '/performance/reviews/me' },
              { label: 'tab.plans', to: '/performance/plans' },
              { label: 'tab.categories', to: '/performance/categories' },
            ],
          },
        ],
      },
      {
        label: 'group.communication',
        items: [messages],
      },
      {
        label: 'group.insights',
        items: [
          {
            id: 'reports',
            label: 'nav.reports',
            icon: ChartColumn,
            to: '/reports',
            paths: ['/reports'],
            tabs: [
              { label: 'tab.overview', to: '/reports' },
              { label: 'tab.reportAttendance', to: '/reports/attendance' },
              { label: 'tab.reportLeave', to: '/reports/leave' },
              { label: 'tab.reportPerformance', to: '/reports/performance' },
              { label: 'tab.reportTasks', to: '/reports/tasks' },
            ],
          },
        ],
      },
    ],
  },
  employee: {
    groups: [
      {
        label: 'group.general',
        items: [
          dashboard,
          {
            id: 'org',
            label: 'nav.organization',
            icon: Network,
            to: '/org-chart',
            paths: ['/org-chart', '/employees/departments'],
            tabs: [
              { label: 'tab.orgChart', to: '/org-chart' },
              { label: 'tab.departments', to: '/employees/departments' },
            ],
          },
        ],
      },
      {
        label: 'group.work',
        items: [
          { id: 'attendance', label: 'nav.myAttendance', icon: CalendarCheck2, to: '/attendance', paths: ['/attendance'] },
          { id: 'requests', label: 'nav.myRequests', icon: FileText, to: '/requests', paths: ['/requests', '/leave-balances'], tabs: requestTabs },
          { id: 'payroll', label: 'nav.myPayslips', icon: Banknote, to: '/payroll/me', paths: ['/payroll'], tabs: [{ label: 'tab.payslips', to: '/payroll/me' }] },
          { id: 'tasks', label: 'nav.myTasks', icon: ListChecks, to: '/tasks/mine', paths: ['/tasks'] },
          { id: 'performance', label: 'nav.myPerformance', icon: Target, to: '/performance/reviews/me', paths: ['/performance'] },
          { id: 'skills', label: 'nav.mySkills', icon: Sparkles, to: '/skills/me', paths: ['/skills', '/employees/skills'], tabs: [{ label: 'tab.mySkills', to: '/skills/me' }, { label: 'tab.catalog', to: '/employees/skills' }, { label: 'tab.skillsMatrix', to: '/employees/skills/matrix' }] },
        ],
      },
      { label: 'group.communication', items: [messages] },
    ],
  },
}

export const accountPages: { label: TKey; to: string }[] = [
  { label: 'nav.myPayslips', to: '/payroll/me' },
  { label: 'nav.profile', to: '/account/profile' },
  { label: 'nav.password', to: '/account/password' },
  { label: 'nav.notifications', to: '/notifications' },
]

export const navFor = (role: Role) => items[role]

export const allItems = (role: Role) => {
  const set = items[role]
  return set.groups.flatMap((group) => group.items)
}

export const tabsFor = (item: NavItem, role: Role) => (item.tabs ?? []).filter((tab) => (!tab.roles || tab.roles.includes(role)) && canAccess(role, tab.to))

export interface Located {
  item: NavItem
  tab: Tab | null
}

const matches = (pathname: string, base: string) => (base === '/' ? pathname === '/' : pathname === base || pathname.startsWith(`${base}/`))

export function locate(role: Role, pathname: string): Located | null {
  let best: Located | null = null
  let bestScore = 0
  for (const item of allItems(role)) {
    const bases = [...item.paths, ...tabsFor(item, role).map((tab) => tab.to)]
    for (const base of bases) {
      if (matches(pathname, base) && base.length + (pathname === base ? 1000 : 0) > bestScore) {
        bestScore = base.length + (pathname === base ? 1000 : 0)
        const tab =
          tabsFor(item, role)
            .filter((candidate) => matches(pathname, candidate.to))
            .sort((a, b) => b.to.length - a.to.length)[0] ?? null
        best = { item, tab }
      }
    }
  }
  return best
}

