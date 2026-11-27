import { useState } from 'react'
import { useParams } from 'react-router'
import { CalendarCheck2, LogIn, LogOut, UserRoundX } from 'lucide-react'
import { useI18n } from '@/i18n'
import { TODAY, addDays } from '@/lib/dates'
import { formatDate, formatNumber, formatTime } from '@/lib/format'
import { attendanceStatusLabels } from '@/lib/labels'
import { useViewer } from '@/app/viewer-context'
import { Badge, Button, ButtonLink, EmptyState, Input, PageHeader, Panel, Select, StatusBadge, Tabs, useToast } from '@/components/ui'
import { ListPanel } from '@/components/shared/ListKit'
import { useList, type FilterDef } from '@/components/shared/useList'
import { PersonCell } from '@/components/shared/Person'
import { WorkdayRibbon } from '@/components/shared/WorkdayRibbon'
import { activeEmployees, departmentOptions, employeeRow, getProfile, teamIds } from '@/features/employees/data'
import type { Attendance, AttendanceStatus } from '@/types/entities'
import { attendance, attendanceFor, summarize } from './data'

const statuses: AttendanceStatus[] = ['present', 'late', 'absent', 'on_leave']

function SummaryStrip({ records }: { records: Attendance[] }) {
  const { t } = useI18n()
  const sum = summarize(records)
  const items = [
    { label: t('at.sum.present'), value: sum.present },
    { label: t('at.sum.late'), value: sum.late },
    { label: t('at.sum.absent'), value: sum.absent },
    { label: t('at.sum.leave'), value: sum.onLeave },
    { label: t('at.sum.hours'), value: sum.hours },
  ]
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-surface border border-ink-200/80 bg-white p-4 shadow-card">
          <p className="text-sm text-ink-500">{item.label}</p>
          <p className="tabular mt-1 text-2xl font-semibold text-ink-900">{formatNumber(item.value)}</p>
        </div>
      ))}
    </div>
  )
}

function RecordsTable({ rows, showPerson }: { rows: Attendance[]; showPerson?: boolean }) {
  const { t } = useI18n()
  const filters: FilterDef<Attendance>[] = [{ key: 'status', label: t('at.col.status'), allLabel: t('k.allStatuses'), options: statuses.map((s) => ({ value: s, label: attendanceStatusLabels[s].label })), test: (row, v) => row.attendance_status === v }]
  const list = useList({
    rows,
    filters,
    search: showPerson ? (row) => employeeRow(row.user_id)?.name ?? '' : undefined,
    sorters: {
      date: (a, b) => a.attendance_date.localeCompare(b.attendance_date),
      hours: (a, b) => (a.working_hours ?? 0) - (b.working_hours ?? 0),
      name: (a, b) => (employeeRow(a.user_id)?.name ?? '').localeCompare(employeeRow(b.user_id)?.name ?? ''),
    },
    initialSort: { key: showPerson ? 'name' : 'date', dir: showPerson ? 'asc' : 'desc' },
  })
  return (
    <ListPanel
        noun="record"
      list={list}
      hideSearch={!showPerson}
      searchPlaceholder={t('at.search')}
      caption={t('at.title')}
      rowKey={(row) => row.attendance_id}
      rowHref={showPerson ? (row) => `/attendance/employee/${row.user_id}` : undefined}
      rowLabel={(row) => employeeRow(row.user_id)?.name ?? ''}
      empty={<EmptyState icon={CalendarCheck2} title={t('at.empty')} />}
      columns={[
        ...(showPerson ? [{ key: 'name', header: t('at.col.employee'), mobile: 'primary' as const, sortable: true, cell: (row: Attendance) => <PersonCell userId={row.user_id} /> }] : []),
        { key: 'date', header: t('at.col.date'), mobile: showPerson ? ('hidden' as const) : ('primary' as const), sortable: true, cell: (row) => <span className="tabular">{formatDate(row.attendance_date)}</span> },
        { key: 'in', header: t('at.col.in'), cell: (row) => <span className="tabular">{formatTime(row.check_in_time)}</span> },
        { key: 'out', header: t('at.col.out'), cell: (row) => <span className="tabular">{formatTime(row.check_out_time)}</span> },
        { key: 'hours', header: t('at.col.hours'), sortable: true, mobile: 'hidden', cell: (row) => <span className="tabular">{row.working_hours == null ? '—' : formatNumber(row.working_hours)}</span> },
        { key: 'status', header: t('at.col.status'), mobile: 'aside', cell: (row) => <StatusBadge value={attendanceStatusLabels[row.attendance_status]} /> },
      ]}
    />
  )
}

function CheckCard() {
  const { t } = useI18n()
  const toast = useToast()
  const { today, checkIn, checkOut, role } = useViewer()
  const showState = role !== 'employee' || today.checkIn !== null
  const action = today.checkIn && !today.checkOut ? (
    <Button icon={LogOut} variant="secondary" onClick={() => { checkOut(); toast.success(t('at.doneOut')) }}>{t('at.checkOut')}</Button>
  ) : !today.checkIn ? (
    <Button icon={LogIn} onClick={() => { checkIn(); toast.success(t('at.doneIn')) }}>{t('at.checkIn')}</Button>
  ) : undefined
  return (
    <Panel className="mb-6" title={t('at.today')} description={formatDate(TODAY)} actions={action}>
      {showState && <WorkdayRibbon checkIn={today.checkIn} checkOut={today.checkOut} />}
      {showState && (
        <p className="mt-3 text-sm text-ink-600">{today.checkOut ? t('at.out', { time: formatTime(today.checkOut) }) : today.checkIn ? t('at.in', { time: formatTime(today.checkIn) }) : t('at.notIn')}</p>
      )}
    </Panel>
  )
}

export function AttendancePage() {
  const { t } = useI18n()
  const { role, userId } = useViewer()
  const [tab, setTab] = useState<'mine' | 'group'>('mine')
  const [day, setDay] = useState(TODAY)
  const [dept, setDept] = useState('')
  const mine = attendanceFor(userId, addDays(TODAY, -60), TODAY)
  const scope = role === 'hr_admin' ? activeEmployees().map((r) => r.user.user_id) : teamIds(userId)
  const inDept = (id: number) => !dept || String(getProfile(id)?.department_id) === dept
  const dayRows = attendance.filter((r) => r.attendance_date === day && scope.includes(r.user_id) && inDept(r.user_id))
  const notIn = scope.filter((id) => inDept(id) && !dayRows.some((r) => r.user_id === id)).length

  return (
    <div>
      <PageHeader title={role === 'employee' ? t('at.titleMine') : t('at.title')} />
      <CheckCard />
      {role !== 'employee' && <Tabs label={t('at.title')} value={tab} onChange={setTab} className="mb-6" items={[{ value: 'mine', label: t('at.tab.mine') }, { value: 'group', label: role === 'hr_admin' ? t('at.tab.all') : t('at.tab.team') }]} />}
      {role === 'employee' ? null : tab === 'mine' ? (
        <>
          <SummaryStrip records={mine} />
          <RecordsTable rows={mine} />
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-600">{t('at.day')}<Input type="date" value={day} max={TODAY} onChange={(e) => e.target.value && setDay(e.target.value)} className="w-44" /></label>
            {role === 'hr_admin' && <Select aria-label={t('k.department')} value={dept} onChange={(e) => setDept(e.target.value)} options={[{ value: '', label: t('k.allDepartments') }, ...departmentOptions()]} />}
            <Badge tone="warning">{t('at.sum.notIn')}: {notIn}</Badge>
          </div>
          <SummaryStrip records={dayRows} />
          <RecordsTable key={`${day}-${dept}`} rows={dayRows} showPerson />
        </>
      )}
    </div>
  )
}

export function EmployeeAttendancePage() {
  const { t } = useI18n()
  const { role, userId } = useViewer()
  const id = Number(useParams().id)
  const row = employeeRow(id)
  const [from, setFrom] = useState(addDays(TODAY, -30))
  const [to, setTo] = useState(TODAY)
  const allowed = role === 'hr_admin' || teamIds(userId).includes(id)
  if (!row || !allowed) return <EmptyState icon={UserRoundX} title={t('k.notFound')} description={row ? t('at.emp.denied') : t('k.notFoundDesc')} action={<ButtonLink to="/attendance" variant="secondary">{t('at.emp.back')}</ButtonLink>} />
  const records = attendanceFor(id, from, to)
  return (
    <div>
      <PageHeader title={t('at.emp.title', { name: row.name })} description={row.profile.position} actions={<ButtonLink to="/attendance" variant="secondary">{t('at.emp.back')}</ButtonLink>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-600">{t('at.from')}<Input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className="w-44" /></label>
        <label className="flex items-center gap-2 text-sm text-ink-600">{t('at.to')}<Input type="date" value={to} min={from} max={TODAY} onChange={(e) => e.target.value && setTo(e.target.value)} className="w-44" /></label>
      </div>
      <SummaryStrip records={records} />
      <RecordsTable key={`${from}-${to}`} rows={records} />
    </div>
  )
}
