import { Link } from 'react-router'
import { ClipboardCheck, FileText, ListChecks, LogIn, LogOut, Sparkles, Users } from 'lucide-react'
import { useI18n } from '@/i18n'
import { NOW_TIME, TODAY } from '@/lib/dates'
import { formatDate, formatNumber, formatTime, formatWeekday } from '@/lib/format'
import { attendanceStatusLabels, requestStatusLabels, taskStatusLabels } from '@/lib/labels'
import { useSample } from '@/lib/sample'
import { useViewer } from '@/app/viewer-context'
import { Badge, Button, ButtonLink, EmptyState, ErrorState, Panel, Progress, SkeletonRows, StatusBadge, useToast } from '@/components/ui'
import { RankedBars } from '@/components/charts/ChartKit'
import { HeroBanner, StatCard, heroOutline, heroSolid } from '@/components/shared/Cards'
import { PersonCell } from '@/components/shared/Person'
import { WorkdayRibbon } from '@/components/shared/WorkdayRibbon'
import { useStore } from '@/store'
import { usePendingApprovals } from '@/store/selectors'
import { todayRecord } from '@/features/attendance/data'
import { directReports } from '@/features/employees/data'
import { LOW_BALANCE_THRESHOLD, getLeaveType, remaining } from '@/features/leave/data'
import { payrollsOf } from '@/features/payroll/data'
import { reviewsOf } from '@/features/performance/data'
import { requestTitle } from '@/features/requests/format'
import { isOverdue, progressOf, tasksAssignedTo } from '@/features/tasks/data'
import { skillsOf } from '@/features/skills/data'
import { ApprovalsPanel } from './ApprovalsPanel'

function greeting() {
  const hour = Number(NOW_TIME.slice(0, 2))
  return hour < 12 ? 'dash.morning' : hour < 17 ? 'dash.afternoon' : 'dash.evening'
}

const openStatus = (status: string) => status === 'to-do' || status === 'in_progress'

export function ManagerDashboard() {
  const { t } = useI18n()
  const { user, userId } = useViewer()
  const pending = usePendingApprovals()
  const tasks = useStore((state) => state.tasks)
  const assignments = useStore((state) => state.assignments)
  const team = directReports(userId)
  const { status, data, retry } = useSample(() => team, [])
  const loading = status === 'loading'
  const present = team.filter((row) => todayRecord(row.user.user_id)).length
  const openFor = (id: number) => tasksAssignedTo(id, tasks, assignments).filter((task) => openStatus(task.task_status))
  const openTotal = team.reduce((sum, row) => sum + openFor(row.user.user_id).length, 0)
  const overdue = team.reduce((sum, row) => sum + openFor(row.user.user_id).filter(isOverdue).length, 0)

  return (
    <div className="flex flex-col gap-8">
      <HeroBanner
        eyebrow={t('dash.eyebrow', { weekday: formatWeekday(TODAY), date: formatDate(TODAY) })}
        title={t(greeting(), { name: user.first_name })}
        summary={t('dm.summaryManager', { pending: pending.length, present, total: team.length })}
        actions={
          <>
            <ButtonLink to="/requests/approvals" size="lg" icon={ClipboardCheck} className={heroSolid}>{t('dash.reviewRequests')}</ButtonLink>
            <ButtonLink to="/tasks/smart" size="lg" variant="ghost" icon={Sparkles} className={heroOutline}>{t('dm.assignTask')}</ButtonLink>
          </>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dm.m.team')} value={team.length} to="/team" loading={loading} hint={t('dm.m.teamHint')} />
        <StatCard label={t('dash.m.present')} value={team.length ? Math.round((present / team.length) * 100) : 0} suffix="%" to="/attendance" hint={t('dash.m.presentHint', { n: present, total: team.length })} loading={loading} />
        <StatCard label={t('dash.m.pending')} value={pending.length} to="/requests/approvals" hint={pending.length ? t('dm.m.pendingHint') : t('dash.m.pendingNone')} loading={loading} />
        <StatCard label={t('dm.m.openTasks')} value={openTotal} to="/tasks/team" hint={t('dm.m.overdue', { n: overdue })} loading={loading} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <ApprovalsPanel status={status} empty={false} onRetry={retry} />
        <Panel title={t('dm.team.title')} flush actions={<ButtonLink to="/team" size="sm" variant="ghost">{t('act.viewAll')}</ButtonLink>}>
          {loading ? <SkeletonRows rows={4} /> : status === 'error' ? <ErrorState compact onRetry={retry} /> : data.length === 0 ? <EmptyState compact icon={Users} title={t('em.team.empty')} /> : (
            <ul className="divide-y divide-ink-100">
              {data.slice(0, 6).map((row) => {
                const record = todayRecord(row.user.user_id)
                return (
                  <li key={row.user.user_id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <PersonCell userId={row.user.user_id} />
                    {record ? <StatusBadge value={attendanceStatusLabels[record.attendance_status]} /> : <Badge>{t('person.notCheckedIn')}</Badge>}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel title={t('dm.load.title')}>
          {loading ? <SkeletonRows rows={4} /> : data.length === 0 ? <EmptyState compact icon={ListChecks} title={t('state.emptyTitle')} /> : <RankedBars items={data.map((row) => ({ label: row.name, value: openFor(row.user.user_id).length }))} format={(value) => formatNumber(value)} />}
        </Panel>
        <Panel title={t('dm.attention.title')} flush>
          {loading ? <SkeletonRows rows={3} /> : (() => {
            const items = tasks.filter((task) => openStatus(task.task_status) && assignments.some((a) => a.task_id === task.task_id && team.some((row) => row.user.user_id === a.user_id))).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4)
            return items.length === 0 ? <EmptyState compact icon={ListChecks} title={t('dm.attention.empty')} /> : (
              <ul className="divide-y divide-ink-100">
                {items.map((task) => (
                  <li key={task.task_id}>
                    <Link to={`/tasks/${task.task_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-50/50">
                      <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink-900">{task.task_title}</span><span className={isOverdue(task) ? 'text-xs font-medium text-danger' : 'text-xs text-ink-500'}>{formatDate(task.deadline)}</span></span>
                      <Progress value={progressOf(task.task_id, assignments)} showValue label={task.task_title} className="w-32" />
                    </Link>
                  </li>
                ))}
              </ul>
            )
          })()}
        </Panel>
      </div>
    </div>
  )
}

export function EmployeeDashboard() {
  const { t } = useI18n()
  const toast = useToast()
  const { user, userId, today, checkIn, checkOut } = useViewer()
  const tasks = useStore((state) => state.tasks)
  const assignments = useStore((state) => state.assignments)
  const balances = useStore((state) => state.balances)
  const requests = useStore((state) => state.requests)
  const { status, retry } = useSample(() => true, false)
  const loading = status === 'loading'
  const mine = tasksAssignedTo(userId, tasks, assignments).filter((task) => openStatus(task.task_status)).sort((a, b) => a.deadline.localeCompare(b.deadline))
  const myBalances = balances.filter((item) => item.user_id === userId)
  const annual = myBalances[0]
  const latestPay = payrollsOf(userId)[0]
  const lastReview = reviewsOf(userId).filter((r) => r.review_status === 'submitted').sort((a, b) => (b.submitted_at ?? '').localeCompare(a.submitted_at ?? ''))[0]
  const myRequests = requests.filter((request) => request.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4)
  const skillCount = skillsOf(userId).length
  const action = today.checkIn && !today.checkOut ? (
    <Button size="lg" icon={LogOut} className={heroSolid} onClick={() => { checkOut(); toast.success(t('at.doneOut')) }}>{t('at.checkOut')}</Button>
  ) : !today.checkIn ? (
    <Button size="lg" icon={LogIn} className={heroSolid} onClick={() => { checkIn(); toast.success(t('at.doneIn')) }}>{t('at.checkIn')}</Button>
  ) : undefined

  return (
    <div className="flex flex-col gap-8">
      <HeroBanner
        eyebrow={t('dash.eyebrow', { weekday: formatWeekday(TODAY), date: formatDate(TODAY) })}
        title={t(greeting(), { name: user.first_name })}
        summary={mine.length ? t('dm.summaryEmployee', { n: mine.length }) : t('dm.noTasks')}
        actions={
          <>
            {action}
            <ButtonLink to="/requests/new" size="lg" variant="ghost" icon={FileText} className={heroOutline}>{t('dm.newRequest')}</ButtonLink>
          </>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dm.m.balance')} value={annual ? remaining(annual) : 0} to="/leave-balances/me" hint={annual && remaining(annual) <= LOW_BALANCE_THRESHOLD ? t('dm.m.balanceLow') : getLeaveType(annual?.leave_type_id)?.type_name} loading={loading} />
        <StatCard label={t('dm.m.openTasks')} value={mine.length} to="/tasks/mine" hint={t('dm.m.overdue', { n: mine.filter(isOverdue).length })} loading={loading} />
        <StatCard label={t('dm.m.latestPay')} value={Math.round(latestPay?.net_salary ?? 0)} to={latestPay ? `/payroll/payslips/${latestPay.payroll_id}` : '/payroll/me'} loading={loading} />
        <StatCard label={t('dm.m.lastReview')} value={Math.round(lastReview?.final_percentage ?? 0)} suffix="%" to="/performance/reviews/me" hint={t('dm.m.skills', { n: skillCount })} loading={loading} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel title={t('at.today')} description={formatDate(TODAY)}>
          {today.checkIn && (
            <>
              <WorkdayRibbon checkIn={today.checkIn} checkOut={today.checkOut} />
              <p className="mt-3 text-sm text-ink-600">{today.checkOut ? t('at.out', { time: formatTime(today.checkOut) }) : t('at.in', { time: formatTime(today.checkIn) })}</p>
            </>
          )}
        </Panel>
        <Panel title={t('dm.myTasks.title')} flush actions={<ButtonLink to="/tasks/mine" size="sm" variant="ghost">{t('act.viewAll')}</ButtonLink>}>
          {loading ? <SkeletonRows rows={3} /> : status === 'error' ? <ErrorState compact onRetry={retry} /> : mine.length === 0 ? <EmptyState compact icon={ListChecks} title={t('dm.noTasks')} /> : (
            <ul className="divide-y divide-ink-100">
              {mine.slice(0, 4).map((task) => (
                <li key={task.task_id}>
                  <Link to={`/tasks/${task.task_id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-50/50">
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink-900">{task.task_title}</span><span className={isOverdue(task) ? 'text-xs font-medium text-danger' : 'text-xs text-ink-500'}>{formatDate(task.deadline)} · {taskStatusLabels[task.task_status].label}</span></span>
                    <Progress value={progressOf(task.task_id, assignments)} showValue label={task.task_title} className="w-28" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title={t('dm.myRequests.title')} flush actions={<ButtonLink to="/requests" size="sm" variant="ghost">{t('act.viewAll')}</ButtonLink>}>
        {loading ? <SkeletonRows rows={3} /> : myRequests.length === 0 ? <EmptyState compact icon={FileText} title={t('dm.myRequests.empty')} action={<ButtonLink to="/requests/new" size="sm">{t('dm.newRequest')}</ButtonLink>} /> : (
          <ul className="divide-y divide-ink-100">
            {myRequests.map((request) => (
              <li key={request.request_id}>
                <Link to={`/requests/${request.request_id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-brand-50/50">
                  <span className="min-w-0"><span className="block truncate font-medium text-ink-900">{requestTitle(request)}</span><span className="text-xs text-ink-500">{formatDate(request.created_at)}</span></span>
                  <StatusBadge value={requestStatusLabels[request.request_status]} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
