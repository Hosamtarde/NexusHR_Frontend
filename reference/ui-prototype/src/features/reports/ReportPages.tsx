import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Banknote, CalendarCheck2, ChartColumn, Download, FileDown, History, ListChecks, Target, UserSearch, Users } from 'lucide-react'
import { useI18n } from '@/i18n'
import { TODAY } from '@/lib/dates'
import { formatDate, formatMoney, formatNumber } from '@/lib/format'
import { useSample } from '@/lib/sample'
import { useViewer } from '@/app/viewer-context'
import { Badge, Button, EmptyState, ErrorState, Input, PageHeader, Panel, Select, SkeletonRows, useToast } from '@/components/ui'
import { RankedBars, SegmentedBar } from '@/components/charts/ChartKit'
import { StatCard } from '@/components/shared/Cards'
import { ListPanel } from '@/components/shared/ListKit'
import { useList } from '@/components/shared/useList'
import { useStore } from '@/store'
import { usePendingApprovals } from '@/store/selectors'
import { departmentOptions } from '@/features/employees/data'
import { taskStatusLabels } from '@/lib/labels'
import { buildReport, type CellKind, type ReportKind } from './build'
import { dashboardData, scopeFor } from './data'

const kinds: { kind: ReportKind; path: string; icon: typeof Users; title: 'rp.att.title' | 'rp.lv.title' | 'rp.pay.title' | 'rp.pf.title' | 'rp.tk.title' | 'rp.rc.title'; desc: 'rp.hub.attDesc' | 'rp.hub.leaveDesc' | 'rp.hub.payDesc' | 'rp.hub.perfDesc' | 'rp.hub.tkDesc' | 'rp.hub.rcDesc'; hrOnly?: boolean }[] = [
  { kind: 'attendance', path: '/reports/attendance', icon: CalendarCheck2, title: 'rp.att.title', desc: 'rp.hub.attDesc' },
  { kind: 'leave', path: '/reports/leave', icon: Users, title: 'rp.lv.title', desc: 'rp.hub.leaveDesc' },
  { kind: 'payroll', path: '/reports/payroll', icon: Banknote, title: 'rp.pay.title', desc: 'rp.hub.payDesc', hrOnly: true },
  { kind: 'performance', path: '/reports/performance', icon: Target, title: 'rp.pf.title', desc: 'rp.hub.perfDesc' },
  { kind: 'tasks', path: '/reports/tasks', icon: ListChecks, title: 'rp.tk.title', desc: 'rp.hub.tkDesc' },
  { kind: 'recruitment', path: '/reports/recruitment', icon: UserSearch, title: 'rp.rc.title', desc: 'rp.hub.rcDesc', hrOnly: true },
]

const taskColors = { 'to-do': 'var(--color-chart-4)', in_progress: 'var(--color-chart-1)', completed: 'var(--color-chart-2)', cancelled: 'var(--color-ink-300)' } as const

export function ReportsHubPage() {
  const { t } = useI18n()
  const { role, userId } = useViewer()
  const tasks = useStore((state) => state.tasks)
  const pending = usePendingApprovals()
  const scope = scopeFor(role, userId)
  const { status, data, retry } = useSample(() => dashboardData(scope), null)
  const loading = status === 'loading'
  const overdue = data?.totals.overdueTasks ?? 0
  const statusCounts = (['to-do', 'in_progress', 'completed', 'cancelled'] as const).map((key) => ({ label: taskStatusLabels[key].label, value: tasks.filter((task) => task.task_status === key).length, color: taskColors[key] }))
  return (
    <div>
      <PageHeader title={t('rp.hub.title')} />
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('rp.hub.stat.people')} value={data?.totals.employees ?? 0} loading={loading} />
        <StatCard label={t('rp.hub.stat.present')} value={data?.totals.presentToday ?? 0} loading={loading} />
        <StatCard label={t('rp.hub.stat.pending')} value={role === 'hr_admin' || role === 'manager' ? pending.length : 0} loading={loading} />
        <StatCard label={t('rp.hub.stat.overdue')} value={overdue} loading={loading} />
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title={t('rp.hub.chartAtt')}>
          {loading ? <SkeletonRows rows={4} /> : status === 'error' ? <ErrorState compact onRetry={retry} /> : !data || data.pulse.length === 0 ? <EmptyState compact icon={ChartColumn} title={t('rp.empty')} /> : <RankedBars max={100} format={(v) => `${formatNumber(v)}%`} items={data.pulse.map((row) => ({ label: row.department, value: row.presenceRate }))} />}
        </Panel>
        <Panel title={t('rp.hub.chartTasks')}>
          <SegmentedBar label={t('rp.hub.chartTasks')} segments={statusCounts} />
        </Panel>
      </div>
      <h2 className="mb-3 text-lg font-semibold text-ink-900">{t('rp.hub.reports')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {kinds.filter((item) => !item.hrOnly || role === 'hr_admin').map((item) => (
          <Link key={item.kind} to={item.path} className="group flex items-start gap-4 rounded-surface border border-ink-200/80 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><item.icon className="size-5" strokeWidth={1.75} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-semibold text-ink-900">{t(item.title)}<ArrowUpRight className="size-4 text-ink-400 transition-colors group-hover:text-brand-600 rtl:-scale-x-100" /></span>
              <span className="mt-1 block text-sm text-ink-600">{t(item.desc)}</span>
            </span>
          </Link>
        ))}
        {role === 'hr_admin' && (
          <Link to="/admin/activity-logs" className="group flex items-start gap-4 rounded-surface border border-ink-200/80 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><History className="size-5" strokeWidth={1.75} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-semibold text-ink-900">{t('rp.hub.actTitle')}<ArrowUpRight className="size-4 text-ink-400 transition-colors group-hover:text-brand-600 rtl:-scale-x-100" /></span>
              <span className="mt-1 block text-sm text-ink-600">{t('rp.hub.actDesc')}</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}

function cell(kind: CellKind, value: string | number | undefined) {
  if (value === undefined) return '—'
  if (kind === 'percent') return <span className="tabular">{formatNumber(Number(value))}%</span>
  if (kind === 'money') return <span className="tabular">{formatMoney(Number(value))}</span>
  if (kind === 'number') return <span className="tabular">{formatNumber(Number(value))}</span>
  if (kind === 'badge') return <Badge tone="brand">{value}</Badge>
  return String(value)
}

export function ReportPage({ kind }: { kind: ReportKind }) {
  const { t } = useI18n()
  const toast = useToast()
  const { role, userId } = useViewer()
  const [from, setFrom] = useState('2026-08-01')
  const [to, setTo] = useState(TODAY)
  const [dept, setDept] = useState('')
  const scope = scopeFor(role, userId)
  const { status, data, retry } = useSample(() => buildReport(kind, { from, to, departmentId: dept ? Number(dept) : undefined }, scope), null)
  const rows = useMemo(() => data?.rows ?? [], [data])
  const first = data?.columns[0]?.key ?? 'employee'
  const list = useList({
    rows,
    search: (row) => String(row[first] ?? ''),
    sorters: Object.fromEntries((data?.columns ?? []).map((col) => [col.key, (a: Record<string, string | number>, b: Record<string, string | number>) => (typeof a[col.key] === 'number' ? Number(a[col.key]) - Number(b[col.key]) : String(a[col.key]).localeCompare(String(b[col.key])))])),
  })
  const exportFile = () => toast.info(t('rp.backendOnly'))
  const chartFormat = (value: number) => (data?.chartKind === 'money' ? formatMoney(value) : data?.chartKind === 'percent' ? `${formatNumber(value)}%` : formatNumber(value))
  const title = data?.title ?? t(kinds.find((item) => item.kind === kind)!.title)
  return (
    <div>
      <PageHeader title={title} description={t('rp.generated', { date: formatDate(TODAY) })} actions={<><Button variant="secondary" icon={Download} onClick={exportFile} disabled={!data || rows.length === 0}>Excel</Button><Button variant="secondary" icon={FileDown} onClick={exportFile} disabled={!data || rows.length === 0}>PDF</Button></>} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-600">{t('rp.f.from')}<Input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className="w-44" /></label>
        <label className="flex items-center gap-2 text-sm text-ink-600">{t('rp.f.to')}<Input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} className="w-44" /></label>
        {role === 'hr_admin' && kind !== 'recruitment' && <Select aria-label={t('rp.f.department')} value={dept} onChange={(e) => setDept(e.target.value)} options={[{ value: '', label: t('k.allDepartments') }, ...departmentOptions()]} />}
      </div>
      {data && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.summary.map((item) => (
            <div key={item.label} className="rounded-surface border border-ink-200/80 bg-white p-4 shadow-card">
              <p className="text-sm text-ink-500">{item.label}</p>
              <p className="tabular mt-1 text-2xl font-semibold text-ink-900">{item.kind === 'money' ? formatMoney(Number(item.value)) : item.kind === 'percent' ? `${formatNumber(Number(item.value))}%` : formatNumber(Number(item.value))}</p>
            </div>
          ))}
        </div>
      )}
      {data && data.chart.length > 0 && (
        <Panel className="mb-6" title={data.chartTitle}>
          <RankedBars items={data.chart} max={data.chartMax} format={chartFormat} />
        </Panel>
      )}
      {status === 'error' ? (
        <ErrorState onRetry={retry} />
      ) : (
        <ListPanel
        noun="record"
          list={{ ...list, status, retry }}
          searchPlaceholder={t('rp.f.search')}
          caption={title}
          rowKey={(row) => `${row[first]}-${row.leaveType ?? row.plan ?? ''}`}
          empty={<EmptyState icon={ChartColumn} title={t('rp.empty')} />}
          columns={(data?.columns ?? []).map((col, index) => ({ key: col.key, header: col.label, mobile: index === 0 ? ('primary' as const) : index === (data?.columns.length ?? 1) - 1 ? ('aside' as const) : ('meta' as const), sortable: true, align: col.kind === 'text' || col.kind === 'badge' ? ('start' as const) : ('start' as const), cell: (row: Record<string, string | number>) => cell(col.kind, row[col.key]) }))}
        />
      )}
    </div>
  )
}
