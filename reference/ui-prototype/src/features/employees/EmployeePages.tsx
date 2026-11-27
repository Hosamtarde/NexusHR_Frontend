import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Pencil, Plus, UserRoundX, Users } from 'lucide-react'
import { useI18n } from '@/i18n'
import { formatDate, formatMoney, formatNumber, formatTime } from '@/lib/format'
import { TODAY, addDays } from '@/lib/dates'
import { attendanceStatusLabels, employmentTypeLabels, planStatusLabels, roleLabels } from '@/lib/labels'
import { useTabParam } from '@/lib/sample'
import type { EmploymentType, Role } from '@/types/entities'
import { Avatar, Badge, Button, ButtonLink, ConfirmDialog, DataTable, DescriptionList, EmptyState, Field, Input, PageHeader, Panel, Progress, Select, StatusBadge, Tabs, useToast } from '@/components/ui'
import { ListPanel, RowActions } from '@/components/shared/ListKit'
import { useList, type FilterDef } from '@/components/shared/useList'
import { PersonCell, PersonStack } from '@/components/shared/Person'
import { BackLink, DetailHero } from '@/components/shared/DetailLayout'
import { useTick, bump } from '@/store/collections'
import { attendanceFor, summarize } from '@/features/attendance/data'
import { balancesFor, getLeaveType, remaining } from '@/features/leave/data'
import { payrollsOf } from '@/features/payroll/data'
import { getPlan, reviewsOf } from '@/features/performance/data'
import { levelLabels, skillCategoryLabels, skillsOf } from '@/features/skills/data'
import { setPassword } from '@/features/auth/credentials'
import { ResetPassword } from './ResetPassword'
import { allEmployees, departmentOptions, directReports, employeeRow, savePerson, setPersonActive, users, type EmployeeRow } from './data'

const roles: Role[] = ['hr_admin', 'manager', 'employee']
const types: EmploymentType[] = ['full_time', 'part_time', 'contract']

export function EmployeesPage() {
  const { t } = useI18n()
  const tick = useTick('people')
  const rows = allEmployees()
  const [resetting, setResetting] = useState<EmployeeRow | null>(null)

  const filters: FilterDef<EmployeeRow>[] = [
    { key: 'dept', label: t('k.department'), allLabel: t('k.allDepartments'), options: departmentOptions(), test: (row, v) => String(row.profile.department_id) === v },
    { key: 'role', label: t('k.role'), allLabel: t('k.allRoles'), options: roles.map((r) => ({ value: r, label: roleLabels[r].label })), test: (row, v) => row.user.role === v },
    { key: 'type', label: t('em.col.type'), allLabel: t('em.list.allTypes'), options: types.map((r) => ({ value: r, label: employmentTypeLabels[r] })), test: (row, v) => row.profile.employment_type === v },
    { key: 'status', label: t('k.status'), allLabel: t('k.allStatuses'), options: [{ value: 'on', label: t('k.active') }, { value: 'off', label: t('k.inactive') }], test: (row, v) => row.user.status === (v === 'on') },
  ]
  const list = useList({
    rows,
    search: (row) => `${row.name} ${row.user.email} ${row.profile.position}`,
    filters,
    sorters: {
      name: (a, b) => a.name.localeCompare(b.name),
      dept: (a, b) => (a.department?.department_name ?? '').localeCompare(b.department?.department_name ?? ''),
      hire: (a, b) => a.profile.hire_date.localeCompare(b.profile.hire_date),
    },
    initialSort: { key: 'name', dir: 'asc' },
  })
  void tick

  return (
    <div>
      <PageHeader title={t('em.list.title')} actions={<><ButtonLink to="/employees/import" variant="secondary">{t('em.imp.action')}</ButtonLink><ButtonLink to="/employees/new" icon={Plus}>{t('em.list.add')}</ButtonLink></>} />
      <ListPanel
        noun="employee"
        list={list}
        searchPlaceholder={t('em.list.search')}
        caption={t('em.list.title')}
        rowKey={(row) => row.user.user_id}
        rowHref={(row) => `/employees/${row.user.user_id}`}
        rowLabel={(row) => row.name}
        empty={<EmptyState icon={Users} title={t('k.noResults')} />}
        columns={[
          { key: 'name', header: t('k.employee'), mobile: 'primary', sortable: true, cell: (row) => <PersonCell userId={row.user.user_id} /> },
          { key: 'dept', header: t('k.department'), sortable: true, cell: (row) => row.department?.department_name ?? '—' },
          { key: 'role', header: t('k.role'), cell: (row) => <StatusBadge value={roleLabels[row.user.role]} /> },
          { key: 'type', header: t('em.col.type'), mobile: 'hidden', cell: (row) => employmentTypeLabels[row.profile.employment_type] },
          { key: 'hire', header: t('em.col.hire'), mobile: 'hidden', sortable: true, cell: (row) => <span className="tabular text-ink-600">{formatDate(row.profile.hire_date)}</span> },
          { key: 'status', header: t('k.status'), mobile: 'aside', cell: (row) => <Badge tone={row.user.status ? 'success' : 'neutral'} dot>{row.user.status ? t('k.active') : t('k.inactive')}</Badge> },
          {
            key: 'actions',
            header: <span className="sr-only">{t('k.actions')}</span>,
            mobile: 'hidden',
            align: 'end',
            cell: (row) => (
              <RowActions
                actions={[
                  { label: t('k.view'), to: `/employees/${row.user.user_id}` },
                  { label: t('em.act.edit'), to: `/employees/${row.user.user_id}/edit` },
                  { label: t('em.act.org'), to: `/org-chart/${row.user.user_id}` },
                  { label: t('em.reset.action'), onSelect: () => setResetting(row) },
                ]}
              />
            ),
          },
        ]}
      />
      {resetting && <ResetPassword key={resetting.user.user_id} userId={resetting.user.user_id} name={resetting.name} open onClose={() => setResetting(null)} />}
    </div>
  )
}

interface FormState {
  first: string
  last: string
  email: string
  phone: string
  password: string
  department: string
  position: string
  hire: string
  type: EmploymentType
  salary: string
}

function EmployeeForm({ id }: { id?: number }) {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const existing = id ? employeeRow(id) : null
  const [form, setForm] = useState<FormState>({
    first: existing?.user.first_name ?? '',
    last: existing?.user.last_name ?? '',
    email: existing?.user.email ?? '',
    phone: existing?.user.phone_number ?? '',
    password: '',
    department: String(existing?.profile.department_id ?? ''),
    position: existing?.profile.position ?? '',
    hire: existing?.profile.hire_date ?? TODAY,
    type: existing?.profile.employment_type ?? 'full_time',
    salary: existing ? String(existing.profile.basic_salary) : '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((old) => ({ ...old, [key]: value }))

  if (id && !existing) return <EmptyState icon={UserRoundX} title={t('k.notFound')} action={<ButtonLink to="/employees" variant="secondary">{t('k.backToList')}</ButtonLink>} />

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.first.trim()) next.first = t('k.required')
    else if (form.first.trim().length > 100) next.first = t('em.form.tooLong', { n: 100 })
    if (!form.last.trim()) next.last = t('k.required')
    else if (form.last.trim().length > 100) next.last = t('em.form.tooLong', { n: 100 })
    if (!id && form.password.length < 6) next.password = t('em.form.passwordMin')
    if (id) void 0
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t('k.invalidEmail')
    else if (users.some((user) => user.email.toLowerCase() === form.email.toLowerCase())) next.email = t('em.form.emailTaken')
    if (!form.department) next.department = t('k.required')
    if (!form.position.trim()) next.position = t('k.required')
    else if (form.position.trim().length > 100) next.position = t('em.form.tooLong', { n: 100 })
    if (!(Number(form.salary) >= 0) || form.salary === '') next.salary = t('k.invalidNumber')
    setErrors(next)
    if (Object.keys(next).length) return
    const userId = savePerson({ first: form.first.trim(), last: form.last.trim(), email: form.email.trim(), phone: form.phone.trim(), role: existing?.user.role ?? 'employee', department: Number(form.department), reportsTo: existing?.profile.reports_to ?? null, position: form.position.trim(), hire: form.hire, type: form.type, salary: Number(form.salary) }, id)
    if (!id) setPassword(userId, form.password, true)
    bump('people')
    toast.success(t(id ? 'em.form.saved' : 'em.form.created', { name: `${form.first} ${form.last}` }))
    navigate(`/employees/${userId}`)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Panel title={t('em.form.account')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('em.form.first')} required error={errors.first}><Input value={form.first} onChange={(e) => set('first', e.target.value)} /></Field>
          <Field label={t('em.form.last')} required error={errors.last}><Input value={form.last} onChange={(e) => set('last', e.target.value)} /></Field>
          <Field label={t('k.email')} required={!id} error={errors.email}><Input type="email" dir="ltr" disabled={Boolean(id)} value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label={t('k.phone')} optional><Input type="tel" dir="ltr" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          {!id && <Field label={t('em.form.password')} required error={errors.password}><Input type="password" autoComplete="new-password" dir="ltr" value={form.password} onChange={(e) => set('password', e.target.value)} /></Field>}
        </div>
      </Panel>
      <Panel title={t('em.form.job')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('k.department')} required error={errors.department}><Select value={form.department} placeholder={t('em.form.choose')} onChange={(e) => set('department', e.target.value)} options={departmentOptions()} /></Field>
          <Field label={t('k.position')} required error={errors.position}><Input value={form.position} onChange={(e) => set('position', e.target.value)} /></Field>
          <Field label={t('em.col.type')}><Select value={form.type} onChange={(e) => set('type', e.target.value as EmploymentType)} options={types.map((r) => ({ value: r, label: employmentTypeLabels[r] }))} /></Field>
          <Field label={t('em.form.hire')}><Input type="date" value={form.hire} onChange={(e) => set('hire', e.target.value)} /></Field>
          <Field label={t('em.form.salary')} required error={errors.salary}><Input type="number" min="0" inputMode="decimal" value={form.salary} onChange={(e) => set('salary', e.target.value)} /></Field>
        </div>
      </Panel>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>{t('k.cancel')}</Button>
        <Button type="submit">{id ? t('k.saveChanges') : t('k.create')}</Button>
      </div>
    </form>
  )
}

export function EmployeeCreatePage() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('em.form.createTitle')} />
      <EmployeeForm />
    </div>
  )
}

export function EmployeeEditPage() {
  const { t } = useI18n()
  const id = Number(useParams().id)
  const row = employeeRow(id)
  return (
    <div>
      <PageHeader title={t('em.form.editTitle', { name: row?.name ?? '' })} />
      <EmployeeForm id={id} />
    </div>
  )
}

const tabValues = ['info', 'attendance', 'leave', 'payroll', 'performance', 'skills'] as const

export function EmployeeProfilePage() {
  const { t } = useI18n()
  const toast = useToast()
  const id = Number(useParams().id)
  const tick = useTick('people')
  const [tab, setTab] = useTabParam(tabValues, 'info')
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  void tick
  const row = employeeRow(id)
  if (!row) return <EmptyState icon={UserRoundX} title={t('k.notFound')} action={<ButtonLink to="/employees" variant="secondary">{t('k.backToList')}</ButtonLink>} />

  const reports = directReports(id)
  const month = addDays(TODAY, -30)
  const records = attendanceFor(id, month, TODAY)
  const sum = summarize(records)
  const balances = balancesFor(id)
  const payslips = payrollsOf(id)
  const reviews = reviewsOf(id)
  const skillList = skillsOf(id)

  return (
    <div>
      <BackLink to="/employees" label={t('k.backToList')} />
      <DetailHero
        name={row.name}
        src={row.user.profile_image}
        position={row.profile.position}
        department={row.department?.department_name}
        eyebrow={<span dir="ltr">{row.user.email}</span>}
        badge={
          <span className="flex items-center gap-2">
            <StatusBadge value={roleLabels[row.user.role]} />
            <Badge tone={row.user.status ? 'success' : 'neutral'} dot>{row.user.status ? t('k.active') : t('k.inactive')}</Badge>
          </span>
        }
        stats={[
          { label: t('em.col.hire'), value: formatDate(row.profile.hire_date) },
          { label: t('em.col.type'), value: employmentTypeLabels[row.profile.employment_type] },
          { label: t('em.form.salary'), value: formatMoney(row.profile.basic_salary) },
          { label: t('em.profile.reports'), value: <PersonStack userIds={reports.map((item) => item.user.user_id)} /> },
        ]}
        actions={
          <>
            <ButtonLink to={`/employees/${id}/edit`} icon={Pencil}>{t('act.edit')}</ButtonLink>
            <Button variant="secondary" onClick={() => setResetting(true)}>{t('em.reset.action')}</Button>
            {row.user.status && <Button variant="secondary" onClick={() => setConfirming(true)}>{t('em.act.deactivate')}</Button>}
          </>
        }
      />
      <div className="mb-6">
        <Tabs
          label={row.name}
          value={tab}
          onChange={setTab}
          items={tabValues.map((value) => ({ value, label: t(`em.profile.${value}` as 'em.profile.info') }))}
        />
      </div>

      {tab === 'info' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel title={t('k.details')}>
            <div className="mb-5 flex items-center gap-4">
              <Avatar src={row.user.profile_image} firstName={row.user.first_name} size="lg" />
              <div>
                <p className="text-lg font-semibold text-ink-900">{row.name}</p>
                <p className="text-sm text-ink-500" dir="ltr">{row.user.email}</p>
              </div>
            </div>
            <DescriptionList
              items={[
                { label: t('k.phone'), value: <span dir="ltr" className="tabular">{row.user.phone_number ?? '—'}</span> },
                { label: t('k.department'), value: row.department?.department_name ?? '—' },
                { label: t('k.position'), value: row.profile.position },
                { label: t('em.col.type'), value: employmentTypeLabels[row.profile.employment_type] },
                { label: t('em.col.hire'), value: formatDate(row.profile.hire_date) },
                { label: t('em.form.salary'), value: <span className="tabular">{formatMoney(row.profile.basic_salary)}</span> },
                { label: t('k.manager'), value: row.manager ? <PersonCell userId={row.manager.user_id} card /> : t('k.none') },
              ]}
            />
          </Panel>
          <Panel title={t('em.profile.reports')}>
            {reports.length === 0 ? (
              <p className="text-sm text-ink-500">{t('em.profile.noReports')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {reports.map((item) => (
                  <li key={item.user.user_id}><PersonCell userId={item.user.user_id} card /></li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {tab === 'attendance' && (
        <Panel title={t('em.profile.last30')} actions={<ButtonLink to={`/attendance/employee/${id}`} variant="secondary" size="sm">{t('em.profile.openAttendance')}</ButtonLink>} flush>
          <div className="grid grid-cols-2 gap-4 border-b border-ink-100 p-4 sm:grid-cols-5">
            {[
              [t('em.profile.present'), sum.present],
              [t('em.profile.late'), sum.late],
              [t('em.profile.absent'), sum.absent],
              [t('em.profile.onLeave'), sum.onLeave],
              [t('em.profile.hours'), sum.hours],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-sm text-ink-500">{label}</p>
                <p className="tabular text-xl font-semibold text-ink-900">{formatNumber(Number(value))}</p>
              </div>
            ))}
          </div>
          <DataTable
            rows={records.slice(0, 8)}
            rowKey={(r) => r.attendance_id}
            caption={t('em.profile.attendance')}
            empty={<EmptyState compact icon={Users} title={t('em.profile.noAttendance')} />}
            columns={[
              { key: 'd', header: t('k.date'), mobile: 'primary', cell: (r) => formatDate(r.attendance_date) },
              { key: 'i', header: t('em.profile.checkIn'), cell: (r) => <span className="tabular">{formatTime(r.check_in_time)}</span> },
              { key: 'o', header: t('em.profile.checkOut'), cell: (r) => <span className="tabular">{formatTime(r.check_out_time)}</span> },
              { key: 's', header: t('k.status'), mobile: 'aside', cell: (r) => <StatusBadge value={attendanceStatusLabels[r.attendance_status]} /> },
            ]}
          />
        </Panel>
      )}

      {tab === 'leave' && (
        <Panel flush>
          <DataTable
            rows={balances}
            rowKey={(b) => b.balance_id}
            caption={t('em.profile.leave')}
            empty={<EmptyState compact icon={Users} title={t('em.profile.noBalances')} />}
            columns={[
              { key: 't', header: t('k.type'), mobile: 'primary', cell: (b) => getLeaveType(b.leave_type_id)?.type_name ?? '—' },
              { key: 'e', header: t('em.profile.entitled'), cell: (b) => <span className="tabular">{b.total_days + b.carried_over}</span> },
              { key: 'u', header: t('em.profile.used'), cell: (b) => <span className="tabular">{b.used_days}</span> },
              { key: 'r', header: t('em.profile.remaining'), mobile: 'aside', cell: (b) => <Progress value={((b.total_days + b.carried_over - remaining(b) ) / Math.max(1, b.total_days + b.carried_over)) * 100} showValue className="w-32" label={String(remaining(b))} /> },
            ]}
          />
        </Panel>
      )}

      {tab === 'payroll' && (
        <Panel flush>
          <DataTable
            rows={payslips}
            rowKey={(p) => p.payroll_id}
            rowHref={(p) => `/payroll/payslips/${p.payroll_id}`}
            rowLabel={(p) => formatDate(p.salary_month)}
            caption={t('em.profile.payroll')}
            empty={<EmptyState compact icon={Users} title={t('em.profile.noPayroll')} />}
            columns={[
              { key: 'm', header: t('k.month'), mobile: 'primary', cell: (p) => formatDate(p.salary_month) },
              { key: 'b', header: t('em.profile.basic'), cell: (p) => <span className="tabular">{formatMoney(p.basic_salary)}</span> },
              { key: 'bo', header: t('em.profile.bonuses'), mobile: 'hidden', cell: (p) => <span className="tabular">{formatMoney(p.bonuses)}</span> },
              { key: 'd', header: t('em.profile.deductions'), mobile: 'hidden', cell: (p) => <span className="tabular">{formatMoney(p.deductions)}</span> },
              { key: 'n', header: t('em.profile.net'), mobile: 'aside', cell: (p) => <span className="tabular font-semibold">{formatMoney(p.net_salary)}</span> },
            ]}
          />
        </Panel>
      )}

      {tab === 'performance' && (
        <Panel flush>
          <DataTable
            rows={reviews}
            rowKey={(r) => r.review_id}
            rowHref={(r) => (r.review_status === 'submitted' ? `/performance/reviews/${r.review_id}` : `/performance/reviews/${r.review_id}/fill`)}
            rowLabel={(r) => getPlan(r.plan_id)?.plan_name ?? ''}
            caption={t('em.profile.performance')}
            empty={<EmptyState compact icon={Users} title={t('em.profile.noReviews')} />}
            columns={[
              { key: 'p', header: t('em.profile.plan'), mobile: 'primary', cell: (r) => getPlan(r.plan_id)?.plan_name ?? '—' },
              { key: 's', header: t('em.profile.score'), cell: (r) => <span className="tabular">{r.final_percentage == null ? '—' : `${formatNumber(r.final_percentage)}%`}</span> },
              { key: 'st', header: t('k.status'), mobile: 'aside', cell: (r) => <StatusBadge value={planStatusLabels[getPlan(r.plan_id)?.plan_status ?? 'draft']} /> },
            ]}
          />
        </Panel>
      )}

      {tab === 'skills' && (
        <Panel>
          {skillList.length === 0 ? (
            <EmptyState compact icon={Users} title={t('em.profile.noSkills')} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {skillList.map((item) => (
                <li key={item.skill_id} className="rounded-xl border border-ink-200/80 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-ink-900">{item.skill.skill_name}</p>
                    {item.verified && <Badge tone="success">{t('em.profile.verified')}</Badge>}
                  </div>
                  <p className="text-xs text-ink-500">{skillCategoryLabels[item.skill.category]} · {t('em.profile.years', { n: item.years })}</p>
                  <Progress value={item.level * 20} className="mt-2" label={levelLabels[item.level]} />
                  <p className="mt-1 text-xs text-ink-600">{levelLabels[item.level]}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <ResetPassword userId={id} name={row.name} open={resetting} onClose={() => setResetting(false)} />
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setPersonActive(id, false)
          bump('people')
          setConfirming(false)
          toast.success(t('em.deactivated', { name: row.name }))
        }}
        title={t('em.deactivate.title', { name: row.name })}
        description={t('em.deactivate.desc')}
        confirmLabel={t('em.act.deactivate')}
        tone="danger"
      />
    </div>
  )
}

