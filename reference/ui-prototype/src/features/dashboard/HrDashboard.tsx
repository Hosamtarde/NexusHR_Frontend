import { Link } from 'react-router'
import { AlarmClock, CalendarClock, ClipboardCheck, UserPlus, Video, type LucideIcon } from 'lucide-react'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { NOW_TIME, TODAY } from '@/lib/dates'
import { daysBetween, formatDate, formatNumber, formatTime, formatWeekday } from '@/lib/format'
import { useSample } from '@/lib/sample'
import { useViewer } from '@/app/viewer-context'
import { ButtonLink, EmptyState, ErrorState, Panel, SkeletonRows } from '@/components/ui'
import { BarsChart, ChartPanel, RankedBars } from '@/components/charts/ChartKit'
import { HeroBanner, StatCard, heroOutline, heroSolid } from '@/components/shared/Cards'
import { usePendingApprovals } from '@/store/selectors'
import { dashboardData } from '@/features/reports/data'
import { ApprovalsPanel } from './ApprovalsPanel'
import { headcount, hrSchedule, interviewsThisWeek, isUpcoming, presentToday, weeklyAttendance, type ScheduleEvent } from './data'
import { useStore } from '@/store'

const kindIcon: Record<ScheduleEvent['kind'], LucideIcon> = { interview: Video, deadline: AlarmClock }
const kindTint: Record<ScheduleEvent['kind'], string> = { interview: 'bg-info-bg text-info', deadline: 'bg-accent-soft text-warning' }

function greetingKey(): 'dash.morning' | 'dash.afternoon' | 'dash.evening' {
  const hour = Number(NOW_TIME.slice(0, 2))
  return hour < 12 ? 'dash.morning' : hour < 17 ? 'dash.afternoon' : 'dash.evening'
}

export function HrDashboard() {
  const { t } = useI18n()
  const { user } = useViewer()
  const pending = usePendingApprovals()
  const applications = useStore((state) => state.applications)
  const tasks = useStore((state) => state.tasks)
  const schedule = hrSchedule(applications, tasks)
  const weekInterviews = interviewsThisWeek(applications)
  const { status, data, retry } = useSample(
    () => ({ week: weeklyAttendance(), schedule, pulse: dashboardData({ departmentIds: null }).pulse }),
    { week: [], schedule: [], pulse: [] },
  )
  const empty = data.week.length === 0
  const loading = status === 'loading'

  const { total, departments } = headcount()
  const present = presentToday()
  const oldest = pending.length ? Math.max(...pending.map((request) => daysBetween(request.created_at.slice(0, 10), TODAY) - 1)) : 0
  const interviewsToday = schedule.filter((event) => event.kind === 'interview' && event.at.startsWith(TODAY)).length

  const summary = pending.length || interviewsToday ? t('dash.summaryHr', { pending: pending.length, interviews: interviewsToday }) : t('dash.allClear')

  return (
    <div className="flex flex-col gap-8">
      <HeroBanner
        eyebrow={t('dash.eyebrow', { weekday: formatWeekday(TODAY), date: formatDate(TODAY) })}
        title={t(greetingKey(), { name: user.first_name })}
        summary={summary}
        actions={
          <>
            <ButtonLink to="/employees/new" size="lg" icon={UserPlus} className={heroSolid}>
              {t('dash.addEmployee')}
            </ButtonLink>
            <ButtonLink to="/requests/approvals" size="lg" variant="ghost" icon={ClipboardCheck} className={heroOutline}>
              {t('dash.reviewRequests')}
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dash.m.employees')} value={total} hint={t('dash.m.employeesHint', { n: departments })} to="/employees" loading={loading} />
        <StatCard label={t('dash.m.present')} value={Math.round((present / total) * 100)} suffix="%" hint={t('dash.m.presentHint', { n: present, total })} to="/attendance" loading={loading} />
        <StatCard label={t('dash.m.pending')} value={pending.length} hint={pending.length ? t('dash.m.pendingHint', { n: oldest }) : t('dash.m.pendingNone')} to="/requests/approvals" loading={loading} />
        <StatCard label={t('dash.m.interviews')} value={weekInterviews} hint={t('dash.m.interviewsHint', { n: interviewsToday })} to="/recruitment/interviews" loading={loading} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ChartPanel
          title={t('dash.attendance.title')}
          status={status}
          onRetry={retry}
          empty={empty}
          series={[
            { key: 'onTime', label: t('dash.attendance.onTime') },
            { key: 'late', label: t('dash.attendance.late') },
          ]}
          table={{
            columns: [t('dash.attendance.day'), t('dash.attendance.onTime'), t('dash.attendance.late')],
            rows: data.week.map((row) => [row.day, row.onTime, row.late]),
          }}
        >
          <BarsChart
            data={data.week.map((row) => ({ day: row.day, onTime: row.onTime, late: row.late }))}
            xKey="day"
            stacked
            series={[
              { key: 'onTime', label: t('dash.attendance.onTime') },
              { key: 'late', label: t('dash.attendance.late') },
            ]}
          />
        </ChartPanel>
        <ApprovalsPanel status={status} empty={empty} onRetry={retry} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Panel title={t('dash.today.title')} flush>
          {loading ? (
            <SkeletonRows rows={3} />
          ) : status === 'error' ? (
            <ErrorState compact onRetry={retry} />
          ) : data.schedule.length === 0 ? (
            <EmptyState compact icon={CalendarClock} title={t('dash.today.empty')} />
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.schedule.map((event) => {
                const Icon = kindIcon[event.kind]
                const upcoming = isUpcoming(event)
                const row = (
                  <>
                    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', kindTint[event.kind])}>
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <span className={cn('min-w-0 flex-1 truncate', upcoming ? 'font-medium text-ink-900' : 'text-ink-500')}>{event.title}</span>
                    <span className="tabular shrink-0 rounded-full bg-ink-50 px-2.5 py-1 text-sm font-medium text-ink-700">{event.at.length > 10 ? `${formatDate(event.at.slice(0, 10))} · ${formatTime(event.at.slice(11, 16))}` : formatDate(event.at)}</span>
                  </>
                )
                return (
                  <li key={`${event.at}-${event.to}`}>
                    {event.to ? (
                      <Link to={event.to} className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-brand-50/50">
                        {row}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-5 py-3.5">{row}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel title={t('dash.dept.title')}>
          {loading ? (
            <SkeletonRows rows={4} />
          ) : status === 'error' ? (
            <ErrorState compact onRetry={retry} />
          ) : data.pulse.length === 0 ? (
            <EmptyState compact icon={CalendarClock} title={t('state.emptyTitle')} />
          ) : (
            <RankedBars
              max={100}
              format={(value) => `${formatNumber(value)}%`}
              items={data.pulse.map((row) => ({ label: row.department, value: row.presenceRate, hint: t('dash.m.presentHint', { n: row.presentToday, total: row.employees }) }))}
            />
          )}
        </Panel>
      </div>
    </div>
  )
}
