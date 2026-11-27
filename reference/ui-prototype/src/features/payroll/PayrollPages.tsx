import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Banknote, Check, Download, FileX2, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { formatDate, formatMoney, formatMonth } from '@/lib/format'
import { useViewer } from '@/app/viewer-context'
import { Badge, Button, ButtonLink, ConfirmDialog, DataTable, DescriptionList, EmptyState, Field, Input, Modal, PageHeader, Panel, Select, useToast } from '@/components/ui'
import { ListPanel } from '@/components/shared/ListKit'
import { useList, type FilterDef } from '@/components/shared/useList'
import { PersonCell } from '@/components/shared/Person'
import { ActionBar, BackLink, DetailGrid, DetailHero } from '@/components/shared/DetailLayout'
import { StatCard } from '@/components/shared/Cards'
import { runPayroll } from '@/store'
import { bump, useTick } from '@/store/collections'
import { departmentOptions, employeeRow, getUser, userName } from '@/features/employees/data'
import { loanRepayments } from '@/features/requests/data'
import { useStore } from '@/store'
import { deletePayroll, hasPayroll, payrolls, getPayroll, updatePayroll, nextRunMonth, payrollsInMonth, payrollsOf, previewRun, runSummaries } from './data'

function money(value: number) {
  return <span className="tabular">{formatMoney(value)}</span>
}

export function PayrollRunsPage() {
  const { t } = useI18n()
  const tick = useTick('payroll')
  void tick
  const runs = runSummaries()
  const sorted = useList({ rows: runs, sorters: { month: (a, b) => a.month.localeCompare(b.month), net: (a, b) => a.net - b.net }, initialSort: { key: 'month', dir: 'desc' } })
  const latest = runs[0]
  return (
    <div>
      <PageHeader title={t('pr.runs.title')} actions={<ButtonLink to="/payroll/run" icon={Plus}>{t('pr.runs.run')}</ButtonLink>} />
      {latest && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t('pr.stat.latest')} value={Math.round(latest.net)} />
          <StatCard label={t('pr.stat.paid')} value={latest.count} />
          <StatCard label={t('pr.stat.avg')} value={Math.round(latest.net / Math.max(1, latest.count))} />
          <StatCard label={t('pr.stat.runs')} value={runs.length} />
        </div>
      )}
      <ListPanel
        noun="run"
        list={sorted}
        hideSearch
        caption={t('pr.runs.title')}
        rowKey={(row) => row.month}
        rowHref={(row) => `/payroll/runs/${row.month.slice(0, 7)}`}
        rowLabel={(row) => formatMonth(row.month)}
        empty={<EmptyState icon={Banknote} title={t('pr.runs.empty')} action={<ButtonLink to="/payroll/run">{t('pr.runs.run')}</ButtonLink>} />}
        columns={[
          { key: 'month', header: t('pr.col.month'), mobile: 'primary', sortable: true, cell: (row) => <span className="font-medium text-ink-900">{formatMonth(row.month)}</span> },
          { key: 'count', header: t('pr.col.employees'), cell: (row) => <span className="tabular">{row.count}</span> },
          { key: 'basic', header: t('pr.col.basic'), mobile: 'hidden', cell: (row) => money(row.basic) },
          { key: 'bonuses', header: t('pr.col.bonuses'), mobile: 'hidden', cell: (row) => money(row.bonuses) },
          { key: 'deductions', header: t('pr.col.deductions'), mobile: 'hidden', cell: (row) => money(row.deductions) },
          { key: 'net', header: t('pr.col.net'), mobile: 'aside', sortable: true, cell: (row) => <span className="tabular font-semibold">{formatMoney(row.net)}</span> },
        ]}
      />
    </div>
  )
}

export function PayrollRunWizardPage() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const tick = useTick('payroll')
  void tick
  const all = previewRun()
  const loans = useStore((state) => state.requests)
  const [step, setStep] = useState(1)
  const [monthValue, setMonthValue] = useState(nextRunMonth().slice(0, 7))
  const [scope, setScope] = useState<'all' | 'one'>('all')
  const [employee, setEmployee] = useState(String(all[0]?.userId ?? ''))
  const [bonus, setBonus] = useState('')
  const [running, setRunning] = useState(false)
  const month = `${monthValue}-01`
  const bonusValid = bonus === '' || (Number(bonus) >= 0 && Math.round(Number(bonus) * 100) === Number(bonus) * 100)
  const bonusAmount = bonus === '' ? 0 : Number(bonus)
  const lines = scope === 'all' ? all : all.filter((line) => line.userId === Number(employee))
  const loanFor = (userId: number) => loanRepayments.filter((item) => item.repayment_status === 'pending' && item.due_date.slice(0, 7) === month.slice(0, 7) && loans.find((r) => r.request_id === item.request_id)?.user_id === userId).reduce((sum, item) => sum + item.amount, 0)
  const skippedIds = lines.filter((line) => hasPayroll(line.userId, month)).map((line) => line.userId)
  const included = lines.filter((line) => !skippedIds.includes(line.userId))
  const netOf = (line: (typeof lines)[number]) => line.basic + bonusAmount - loanFor(line.userId)
  const total = included.reduce((sum, line) => sum + netOf(line), 0)
  const blocked = !monthValue || !bonusValid || (scope === 'one' && skippedIds.length > 0) || included.length === 0
  const steps = [t('pr.run.step1'), t('pr.run.step2'), t('pr.run.step3')]
  const submit = () => {
    setRunning(true)
    window.setTimeout(() => {
      const result = runPayroll(month, bonusAmount, scope === 'one' ? Number(employee) : null)
      toast.success(t('pr.run.done', { month: formatMonth(month), n: result.generated }), result.skipped ? t('pr.run.skippedN', { n: result.skipped }) : undefined)
      navigate(`/payroll/runs/${month.slice(0, 7)}`)
    }, 600)
  }
  return (
    <div>
      <PageHeader title={t('pr.run.title')} />
      <ol className="mb-6 flex items-center gap-3" aria-label={t('pr.run.title')}>
        {steps.map((label, index) => (
          <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className="flex items-center gap-2 text-sm">
            <span className={cn('tabular grid size-7 place-items-center rounded-full font-semibold', step > index + 1 ? 'bg-success text-white' : step === index + 1 ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500')}>{step > index + 1 ? <Check className="size-4" /> : index + 1}</span>
            <span className={cn(step === index + 1 ? 'font-medium text-ink-900' : 'text-ink-500')}>{label}</span>
            {index < steps.length - 1 && <span className="mx-1 h-px w-6 bg-ink-200 sm:w-12" aria-hidden />}
          </li>
        ))}
      </ol>
      {step === 1 && (
        <Panel title={t('pr.run.month')}>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <Field label={t('pr.run.month')}><Input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} /></Field>
            <Field label={t('pr.run.scope')}>
              <Select value={scope} onChange={(event) => setScope(event.target.value as 'all' | 'one')} options={[{ value: 'all', label: t('pr.run.scopeAll') }, { value: 'one', label: t('pr.run.scopeOne') }]} />
            </Field>
            {scope === 'one' && (
              <Field label={t('pr.col.employee')}>
                <Select value={employee} onChange={(event) => setEmployee(event.target.value)} options={all.map((line) => ({ value: String(line.userId), label: userName(line.userId) }))} />
              </Field>
            )}
            <Field label={t('pr.run.bonusAll')} hint={t('pr.run.bonusHint')} error={bonusValid ? undefined : t('pr.slip.errMoney')} optional>
              <Input type="number" min="0" step="0.01" inputMode="decimal" value={bonus} onChange={(event) => setBonus(event.target.value)} />
            </Field>
          </div>
          <p className="mt-4 max-w-2xl rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{t('pr.run.rules')}</p>
          <div className="mt-6 flex justify-end"><Button onClick={() => setStep(2)} disabled={!monthValue || !bonusValid}>{t('pr.run.next')}</Button></div>
        </Panel>
      )}
      {step === 2 && (
        <Panel flush title={t('pr.run.review')}>
          <DataTable
            rows={lines}
            rowKey={(line) => line.userId}
            caption={t('pr.run.title')}
            columns={[
              { key: 'p', header: t('pr.col.employee'), mobile: 'primary', cell: (line) => <PersonCell userId={line.userId} /> },
              { key: 'basic', header: t('pr.col.basic'), cell: (line) => money(line.basic) },
              { key: 'bonus', header: t('pr.run.bonus'), mobile: 'hidden', cell: () => money(bonusAmount) },
              { key: 'loan', header: t('pr.run.loan'), mobile: 'hidden', cell: (line) => money(loanFor(line.userId)) },
              { key: 'net', header: t('pr.col.net'), mobile: 'aside', cell: (line) => (skippedIds.includes(line.userId) ? <Badge tone="warning">{t('pr.run.skipped')}</Badge> : <span className="tabular font-semibold">{formatMoney(netOf(line))}</span>) },
            ]}
          />
          {skippedIds.length > 0 && <p className="border-t border-ink-100 px-4 py-3 text-sm text-warning">{scope === 'one' ? t('pr.run.existsOne') : t('pr.run.skippedNote', { n: skippedIds.length })}</p>}
          <div className="flex justify-between border-t border-ink-100 p-4">
            <Button variant="secondary" onClick={() => setStep(1)}>{t('pr.run.back')}</Button>
            <Button onClick={() => setStep(3)} disabled={blocked}>{t('pr.run.next')}</Button>
          </div>
        </Panel>
      )}
      {step === 3 && (
        <Panel title={t('pr.run.confirm')} description={t('pr.run.confirmDesc', { n: included.length })}>
          <DescriptionList items={[{ label: t('pr.col.month'), value: formatMonth(month) }, { label: t('pr.col.employees'), value: included.length }, { label: t('pr.run.bonusAll'), value: money(bonusAmount) }, { label: t('pr.col.net'), value: money(total) }]} />
          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)} disabled={running}>{t('pr.run.back')}</Button>
            <Button onClick={submit} loading={running}>{t('pr.run.confirm')}</Button>
          </div>
        </Panel>
      )}
    </div>
  )
}

export function PayrollRunDetailPage() {
  const { t } = useI18n()
  const key = useParams().month ?? ''
  const month = `${key}-01`
  const tick = useTick('payroll')
  void tick
  const rows = payrollsInMonth(month)
  const list = useList({
    rows,
    search: (row) => employeeRow(row.user_id)?.name ?? '',
    sorters: { name: (a, b) => (employeeRow(a.user_id)?.name ?? '').localeCompare(employeeRow(b.user_id)?.name ?? ''), net: (a, b) => a.net_salary - b.net_salary },
    initialSort: { key: 'name', dir: 'asc' },
  })
  const net = rows.reduce((sum, row) => sum + row.net_salary, 0)
  if (rows.length === 0) return <EmptyState icon={FileX2} title={t('k.notFound')} action={<ButtonLink to="/payroll" variant="secondary">{t('pr.detail.back')}</ButtonLink>} />
  return (
    <div>
      <PageHeader title={t('pr.detail.title', { month: formatMonth(month) })} description={`${t('pr.stat.paid')}: ${rows.length} · ${t('pr.col.net')}: ${formatMoney(net)}`} actions={<ButtonLink to="/payroll" variant="secondary">{t('pr.detail.back')}</ButtonLink>} />
      <ListPanel
        noun="payslip"
        list={list}
        searchPlaceholder={t('pr.detail.search')}
        caption={t('pr.runs.title')}
        rowKey={(row) => row.payroll_id}
        rowHref={(row) => `/payroll/payslips/${row.payroll_id}`}
        rowLabel={(row) => employeeRow(row.user_id)?.name ?? ''}
        empty={<EmptyState icon={Banknote} title={t('pr.detail.empty')} />}
        columns={[
          { key: 'name', header: t('pr.col.employee'), mobile: 'primary', sortable: true, cell: (row) => <PersonCell userId={row.user_id} /> },
          { key: 'basic', header: t('pr.col.basic'), mobile: 'hidden', cell: (row) => money(row.basic_salary) },
          { key: 'bonus', header: t('pr.col.bonuses'), mobile: 'hidden', cell: (row) => money(row.bonuses) },
          { key: 'ded', header: t('pr.col.deductions'), mobile: 'hidden', cell: (row) => money(row.deductions) },
          { key: 'net', header: t('pr.col.net'), mobile: 'aside', sortable: true, cell: (row) => <span className="tabular font-semibold">{formatMoney(row.net_salary)}</span> },
        ]}
      />
    </div>
  )
}

export function AllPayslipsPage() {
  const { t } = useI18n()
  const tick = useTick('payroll')
  void tick
  const rows = payrolls.slice().sort((a, b) => b.salary_month.localeCompare(a.salary_month) || b.payroll_id - a.payroll_id)
  const months = [...new Set(rows.map((row) => row.salary_month))]
  const filters: FilterDef<(typeof rows)[number]>[] = [
    { key: 'month', label: t('pr.col.month'), allLabel: t('pr.f.allMonths'), options: months.map((value) => ({ value, label: formatMonth(value) })), test: (row, value) => row.salary_month === value },
    { key: 'dept', label: t('k.department'), allLabel: t('k.allDepartments'), options: departmentOptions(), test: (row, value) => String(employeeRow(row.user_id)?.department?.department_id ?? '') === value },
  ]
  const list = useList({
    rows,
    filters,
    search: (row) => employeeRow(row.user_id)?.name ?? '',
    sorters: { name: (a, b) => (employeeRow(a.user_id)?.name ?? '').localeCompare(employeeRow(b.user_id)?.name ?? ''), month: (a, b) => a.salary_month.localeCompare(b.salary_month), net: (a, b) => a.net_salary - b.net_salary },
    initialSort: { key: 'month', dir: 'desc' },
  })
  return (
    <div>
      <PageHeader title={t('pr.all.title')} />
      <ListPanel
        noun="payslip"
        list={list}
        searchPlaceholder={t('pr.detail.search')}
        caption={t('pr.all.title')}
        rowKey={(row) => row.payroll_id}
        rowHref={(row) => `/payroll/payslips/${row.payroll_id}`}
        rowLabel={(row) => employeeRow(row.user_id)?.name ?? ''}
        empty={<EmptyState icon={Banknote} title={t('pr.detail.empty')} />}
        columns={[
          { key: 'name', header: t('pr.col.employee'), mobile: 'primary', sortable: true, cell: (row) => <PersonCell userId={row.user_id} /> },
          { key: 'month', header: t('pr.col.month'), sortable: true, cell: (row) => formatMonth(row.salary_month) },
          { key: 'basic', header: t('pr.col.basic'), mobile: 'hidden', cell: (row) => money(row.basic_salary) },
          { key: 'ded', header: t('pr.col.deductions'), mobile: 'hidden', cell: (row) => money(row.deductions) },
          { key: 'net', header: t('pr.col.net'), mobile: 'aside', sortable: true, cell: (row) => <span className="tabular font-semibold">{formatMoney(row.net_salary)}</span> },
        ]}
      />
    </div>
  )
}

export function PayslipPage() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { role, userId } = useViewer()
  const tick = useTick('payroll')
  void tick
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [form, setForm] = useState({ bonuses: '', deductions: '' })
  const [formError, setFormError] = useState('')
  const payroll = getPayroll(Number(useParams().id))
  if (!payroll || (role !== 'hr_admin' && payroll.user_id !== userId)) return <EmptyState icon={FileX2} title={t('k.notFound')} description={payroll ? t('pr.slip.denied') : t('k.notFoundDesc')} action={<ButtonLink to="/payroll/me" variant="secondary">{t('pr.slip.back')}</ButtonLink>} />
  const row = employeeRow(payroll.user_id)
  const gross = payroll.basic_salary + payroll.bonuses
  const line = (label: string, value: number, strong?: boolean) => (
    <div className={cn('flex items-center justify-between py-2.5', strong && 'font-semibold text-ink-900')}>
      <dt className={strong ? '' : 'text-ink-600'}>{label}</dt>
      <dd className="tabular">{formatMoney(value)}</dd>
    </div>
  )
  return (
    <div>
      <BackLink to={role === 'hr_admin' ? `/employees/${payroll.user_id}?tab=payroll` : '/payroll/me'} label={t('pr.slip.back')} />
      <DetailHero
        name={row?.name ?? userName(payroll.user_id)}
        src={getUser(payroll.user_id)?.profile_image}
        userId={payroll.user_id}
        eyebrow={t('pr.slip.issued', { date: formatDate(payroll.generated_at) })}
        position={row?.profile.position}
        department={row?.department?.department_name}
        personTo={role === 'hr_admin' ? `/employees/${payroll.user_id}` : undefined}
        badge={<Badge tone="brand">{formatMonth(payroll.salary_month)}</Badge>}
        stats={[
          { label: t('pr.slip.basic'), value: formatMoney(payroll.basic_salary) },
          { label: t('pr.slip.bonuses'), value: formatMoney(payroll.bonuses) },
          { label: t('pr.slip.totalDed'), value: formatMoney(payroll.deductions) },
          { label: t('pr.slip.net'), value: formatMoney(payroll.net_salary) },
        ]}
      />
      <DetailGrid
        main={
          <Panel title={t('pr.slip.title', { month: formatMonth(payroll.salary_month) })}>
            <div className="grid gap-8 sm:grid-cols-2">
              <section>
                <h2 className="mb-1 text-sm font-semibold text-ink-900">{t('pr.slip.earnings')}</h2>
                <dl className="divide-y divide-ink-100">{line(t('pr.slip.basic'), payroll.basic_salary)}{line(t('pr.slip.bonuses'), payroll.bonuses)}{line(t('pr.slip.gross'), gross, true)}</dl>
              </section>
              <section>
                <h2 className="mb-1 text-sm font-semibold text-ink-900">{t('pr.slip.deductions')}</h2>
                <dl className="divide-y divide-ink-100">{line(t('pr.slip.totalDed'), payroll.deductions, true)}</dl>
              </section>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-brand-50 px-5 py-4">
              <span className="font-semibold text-brand-900">{t('pr.slip.net')}</span>
              <span className="tabular text-2xl font-bold text-brand-800">{formatMoney(payroll.net_salary)}</span>
            </div>
          </Panel>
        }
        side={
          <Panel title={t('pr.slip.owner')}>
            <PersonCell userId={payroll.user_id} size="md" card />
            <p className="mt-3 text-sm text-ink-500">{row?.department?.department_name}</p>
          </Panel>
        }
      />
      <ActionBar>
        {role === 'hr_admin' && (
          <>
            <Button variant="ghost" icon={Trash2} onClick={() => setRemoving(true)}>
              {t('act.delete')}
            </Button>
            <Button
              variant="secondary"
              icon={Pencil}
              onClick={() => {
                setForm({ bonuses: String(payroll.bonuses), deductions: String(payroll.deductions) })
                setFormError('')
                setEditing(true)
              }}
            >
              {t('act.edit')}
            </Button>
          </>
        )}
        <Button icon={Download} variant="secondary" onClick={() => toast.success(t('pr.slip.downloaded'))}>
          {t('pr.slip.download')}
        </Button>
      </ActionBar>
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title={t('pr.slip.editTitle')}
        description={t('pr.slip.editDesc')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>{t('act.cancel')}</Button>
            <Button
              onClick={() => {
                const ok = (value: string) => value !== '' && Number(value) >= 0 && Math.round(Number(value) * 100) === Number(value) * 100
                if (!ok(form.bonuses) || !ok(form.deductions)) return setFormError(t('pr.slip.errMoney'))
                updatePayroll(payroll.payroll_id, Number(form.bonuses), Number(form.deductions))
                bump('payroll')
                toast.success(t('pr.slip.saved'))
                setEditing(false)
              }}
            >
              {t('act.save')}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('pr.slip.bonuses')} error={formError || undefined}><Input type="number" min="0" step="0.01" value={form.bonuses} onChange={(event) => setForm((old) => ({ ...old, bonuses: event.target.value }))} /></Field>
          <Field label={t('pr.slip.totalDed')}><Input type="number" min="0" step="0.01" value={form.deductions} onChange={(event) => setForm((old) => ({ ...old, deductions: event.target.value }))} /></Field>
        </div>
      </Modal>
      <ConfirmDialog
        open={removing}
        onClose={() => setRemoving(false)}
        onConfirm={() => {
          deletePayroll(payroll.payroll_id)
          bump('payroll')
          toast.success(t('pr.slip.deleted'))
          navigate('/payroll/payslips')
        }}
        title={t('pr.slip.deleteTitle')}
        description={t('pr.slip.deleteDesc')}
        confirmLabel={t('act.delete')}
        tone="danger"
      />
    </div>
  )
}

export function MyPayslipsPage() {
  const { t } = useI18n()
  const { userId } = useViewer()
  const tick = useTick('payroll')
  void tick
  const mine = payrollsOf(userId)
  const list = useList({ rows: mine, sorters: { month: (a, b) => a.salary_month.localeCompare(b.salary_month), net: (a, b) => a.net_salary - b.net_salary }, initialSort: { key: 'month', dir: 'desc' } })
  const latest = mine[0]
  const year = mine.filter((item) => item.salary_month.startsWith('2026')).reduce((sum, item) => sum + item.net_salary, 0)
  return (
    <div>
      <PageHeader title={t('pr.me.title')} />
      {latest && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <StatCard label={`${t('pr.me.latest')} · ${formatMonth(latest.salary_month)}`} value={Math.round(latest.net_salary)} to={`/payroll/payslips/${latest.payroll_id}`} />
          <StatCard label={t('pr.me.ytd')} value={Math.round(year)} />
        </div>
      )}
      <ListPanel
        noun="loan"
        list={list}
        hideSearch
        caption={t('pr.me.title')}
        rowKey={(row) => row.payroll_id}
        rowHref={(row) => `/payroll/payslips/${row.payroll_id}`}
        rowLabel={(row) => formatMonth(row.salary_month)}
        empty={<EmptyState icon={Banknote} title={t('pr.me.empty')} />}
        columns={[
          { key: 'month', header: t('pr.col.month'), mobile: 'primary', sortable: true, cell: (row) => <span className="font-medium text-ink-900">{formatMonth(row.salary_month)}</span> },
          { key: 'basic', header: t('pr.col.basic'), mobile: 'hidden', cell: (row) => money(row.basic_salary) },
          { key: 'bonus', header: t('pr.col.bonuses'), mobile: 'hidden', cell: (row) => money(row.bonuses) },
          { key: 'ded', header: t('pr.col.deductions'), mobile: 'hidden', cell: (row) => money(row.deductions) },
          { key: 'net', header: t('pr.col.net'), mobile: 'aside', sortable: true, cell: (row) => <span className="tabular font-semibold">{formatMoney(row.net_salary)}</span> },
        ]}
      />
    </div>
  )
}
