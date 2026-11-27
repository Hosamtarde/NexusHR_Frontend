import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CheckCircle2, FilePlus2, FileText, Inbox, Trash2, XCircle } from 'lucide-react'
import { useI18n } from '@/i18n'
import { TODAY, addDays } from '@/lib/dates'
import { daysBetween, formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { repaymentStatusLabels, requestStatusLabels, requestTypeLabels } from '@/lib/labels'
import { paginate, useAction, usePageParam, useQueryParam, useSample } from '@/lib/sample'
import type { HrRequest, RequestType } from '@/types/entities'
import { useViewer } from '@/app/viewer-context'
import {
  Button,
  ButtonLink,
  ConfirmDialog,
  DataTable,
  DescriptionList,
  EmptyState,
  Field,
  FileDrop,
  FilterBar,
  Input,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  Select,
  StatusBadge,
  Textarea,
  useToast,
} from '@/components/ui'
import { PersonCell } from '@/components/shared/Person'
import { ActionBar, BackLink, DetailGrid, DetailHero, RichTimeline, type RichStep } from '@/components/shared/DetailLayout'
import { DiscussButton } from '@/features/messages/records'
import { ForbiddenPage } from '@/features/system/ErrorPages'
import { departments, getProfile, getUser, teamIds, userName } from '@/features/employees/data'
import { getLeaveType, remaining } from '@/features/leave/data'
import { ensureSchedule, monthlyInstallment, canReview, requestsFor, reviewQueue, visibleRequests } from './data'
import { requestTitle } from './format'
import { RequestList } from './RequestList'
import { removeRequest, reviewRequest, submitRequest, useStore } from '@/store'
import type { LoanRepayment } from '@/types/entities'

type Mode = 'pending' | 'mine' | 'all'

const limit = 10

function useDecide() {
  const { t } = useI18n()
  const toast = useToast()
  const { userId } = useViewer()
  return (id: number, decision: 'approved' | 'rejected') => {
    const undo = reviewRequest(id, decision, userId)
    toast.success(t(decision === 'approved' ? 'rq.review.approved' : 'rq.review.rejected'), t('dash.approvals.notified'), { label: t('rq.review.undo'), onClick: undo })
  }
}

function RequestsListPage({ mode }: { mode: Mode }) {
  const { t } = useI18n()
  const { role, userId } = useViewer()
  const requests = useStore((state) => state.requests)
  const decide = useDecide()
  const [q, setQ] = useQueryParam('q')
  const [statusFilter, setStatusFilter] = useQueryParam('status')
  const [typeFilter, setTypeFilter] = useQueryParam('type')
  const [page, setPage] = usePageParam()

  const base = useMemo(() => {
    const list = mode === 'pending' ? reviewQueue(role, userId, requests) : mode === 'mine' ? requestsFor(userId, requests) : visibleRequests(role, userId, requests)
    return list.slice().sort((a, b) => (mode === 'pending' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at)))
  }, [mode, role, userId, requests])

  const { status, data, retry } = useSample(() => base, [])
  const needle = q.trim().toLowerCase()
  const filtered = data.filter((request) => {
    if (statusFilter && request.request_status !== statusFilter) return false
    if (typeFilter && request.request_type !== typeFilter) return false
    if (!needle) return true
    return `${userName(request.user_id)} ${requestTitle(request)}`.toLowerCase().includes(needle)
  })
  const paged = paginate(filtered, page, limit)
  const showPerson = mode !== 'mine'
  const titleKey = mode === 'pending' ? 'rq.pending.title' : mode === 'mine' ? 'rq.my.title' : role === 'hr_admin' ? 'rq.all.title' : 'rq.team.title'

  return (
    <div>
      <PageHeader
        title={t(titleKey)}
        actions={
          <ButtonLink to="/requests/new" icon={FilePlus2}>
            {t('rq.new')}
          </ButtonLink>
        }
      />
      <Panel flush>
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder={t('rq.search')} className="sm:max-w-xs sm:flex-1" />
          {mode === 'all' && (
            <>
              <Select
                aria-label={t('rq.col.status')}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={[{ value: '', label: t('rq.allStatuses') }, ...(['pending', 'approved', 'rejected'] as const).map((value) => ({ value, label: requestStatusLabels[value].label }))]}
              />
              <Select
                aria-label={t('rq.form.type')}
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                options={[{ value: '', label: t('rq.allTypes') }, ...(['leave', 'loan', 'permission', 'custom'] as const).map((value) => ({ value, label: requestTypeLabels[value] }))]}
              />
            </>
          )}
        </FilterBar>
        <RequestList
          rows={paged.items}
          status={status}
          onRetry={retry}
          showPerson={showPerson}
          onDecide={mode === 'pending' ? decide : undefined}
          empty={
            mode === 'pending' ? (
              <EmptyState icon={Inbox} title={t('rq.empty.pendingTitle')} />
            ) : (
              <EmptyState icon={Inbox} title={t('rq.empty.title')} action={<ButtonLink to="/requests/new" icon={FilePlus2}>{t('rq.new')}</ButtonLink>} />
            )
          }
        />
        {status === 'ready' && <Pagination noun="request" page={paged.page} limit={limit} total={paged.total} onChange={setPage} />}
      </Panel>
    </div>
  )
}

export const PendingRequestsPage = () => <RequestsListPage mode="pending" />
export const MyRequestsPage = () => <RequestsListPage mode="mine" />
export const AllRequestsPage = () => <RequestsListPage mode="all" />

interface FormState {
  type: RequestType
  leaveTypeId: string
  start: string
  end: string
  amount: string
  months: string
  title: string
  reason: string
}

export function NewRequestPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const toast = useToast()
  const { userId } = useViewer()
  const balances = useStore((state) => state.balances)
  const leaveTypes = useStore((state) => state.leaveTypes)
  const { pending, run } = useAction()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | undefined>()
  const [touched, setTouched] = useState(false)
  const [form, setForm] = useState<FormState>({ type: 'leave', leaveTypeId: String(leaveTypes[0]?.leave_type_id ?? ''), start: addDays(TODAY, 4), end: addDays(TODAY, 6), amount: '', months: '6', title: '', reason: '' })
  const set = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }))

  const balance = balances.find((item) => item.user_id === userId && item.leave_type_id === Number(form.leaveTypeId))
  const days = form.start && form.end && form.end >= form.start ? daysBetween(form.start, form.end) : 0
  const amount = Number(form.amount)
  const months = Number(form.months)

  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!form.reason.trim()) errors.reason = t('rq.form.errRequired')
  if (form.type === 'leave') {
    if (!form.start) errors.start = t('rq.form.errRequired')
    if (!form.end) errors.end = t('rq.form.errRequired')
    else if (form.end < form.start) errors.end = t('rq.form.errOrder')
    else if (balance && days > remaining(balance)) errors.end = t('rq.form.errBalance')
  }
  if (form.type === 'loan') {
    if (!(amount >= 1)) errors.amount = t('rq.form.errAmount')
    if (!(Number.isInteger(months) && months >= 1)) errors.months = t('rq.form.errMonths')
  }
  if (form.type === 'custom' && (form.title.trim().length < 3 || form.title.trim().length > 150)) errors.title = t('rq.form.errTitle')
  const shown = (key: keyof FormState) => (touched ? errors[key] : undefined)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (Object.keys(errors).length > 0) return
    void run(() => {
      const created = submitRequest(
        {
          request_type: form.type,
          request_title: form.type === 'custom' ? form.title.trim() : null,
          leave_type_id: form.type === 'leave' ? Number(form.leaveTypeId) : null,
          start_date: form.type === 'leave' ? form.start : null,
          end_date: form.type === 'leave' ? form.end : null,
          loan_amount: form.type === 'loan' ? amount : null,
          repayment_period: form.type === 'loan' ? months : null,
          reason: form.reason.trim(),
          attachment: file?.name ?? null,
        },
        userId,
      )
      toast.success(t('rq.form.done'), t('rq.form.doneDesc'))
      navigate(`/requests/${created.request_id}`)
    })
  }

  return (
    <div>
      <PageHeader title={t('rq.form.title')} />
      <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('rq.form.type')} className="sm:col-span-2">
              <Select
                value={form.type}
                onChange={(event) => set({ type: event.target.value as RequestType })}
                options={(['leave', 'loan', 'permission', 'custom'] as const).map((value) => ({ value, label: requestTypeLabels[value] }))}
              />
            </Field>
            {form.type === 'leave' && (
              <>
                <Field label={t('rq.form.leaveType')} className="sm:col-span-2" hint={balance ? t('rq.form.balance', { n: remaining(balance) }) : undefined}>
                  <Select value={form.leaveTypeId} onChange={(event) => set({ leaveTypeId: event.target.value })} options={leaveTypes.map((type) => ({ value: type.leave_type_id, label: type.type_name }))} />
                </Field>
                <Field label={t('rq.form.from')} error={shown('start')}>
                  <Input type="date" value={form.start} onChange={(event) => set({ start: event.target.value })} />
                </Field>
                <Field label={t('rq.form.to')} error={shown('end')} hint={days > 0 ? t('rq.form.daysCount', { n: days }) : undefined}>
                  <Input type="date" value={form.end} onChange={(event) => set({ end: event.target.value })} />
                </Field>
              </>
            )}
            {form.type === 'loan' && (
              <>
                <Field label={t('rq.form.amount')} error={shown('amount')}>
                  <Input type="number" inputMode="numeric" value={form.amount} onChange={(event) => set({ amount: event.target.value })} placeholder="3000" />
                </Field>
                <Field label={t('rq.form.months')} error={shown('months')} hint={amount > 0 && months > 0 ? t('rq.form.installment', { amount: formatMoney(monthlyInstallment(amount, months)) }) : undefined}>
                  <Input type="number" inputMode="numeric" value={form.months} onChange={(event) => set({ months: event.target.value })} />
                </Field>
              </>
            )}
            {form.type === 'custom' && (
              <Field label={t('rq.form.customTitle')} error={shown('title')} className="sm:col-span-2">
                <Input value={form.title} onChange={(event) => set({ title: event.target.value })} />
              </Field>
            )}
            <Field label={t('rq.form.reason')} error={shown('reason')} className="sm:col-span-2">
              <Textarea rows={4} value={form.reason} onChange={(event) => set({ reason: event.target.value })} />
            </Field>
            <Field label={t('rq.form.attachment')} optional className="sm:col-span-2">
              <FileDrop file={file} onChange={setFile} error={fileError} onError={setFileError} />
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-ink-100 pt-5">
            <ButtonLink to="/requests" variant="secondary">
              {t('act.cancel')}
            </ButtonLink>
            <Button type="submit" loading={pending}>
              {t('rq.form.submit')}
            </Button>
          </div>
        </Panel>
        <Panel title={t('rq.form.summary')}>
          <DescriptionList
            columns={1}
            items={[
              { label: t('rq.form.type'), value: requestTypeLabels[form.type] },
              ...(form.type === 'leave' ? [{ label: t('rq.detail.duration'), value: days > 0 ? t('rq.days', { n: days }) : '—' }] : []),
              ...(form.type === 'loan' ? [{ label: t('rq.detail.amount'), value: amount > 0 ? formatMoney(amount) : '—' }] : []),
            ]}
          />
        </Panel>
      </form>
    </div>
  )
}

function scheduleFor(request: HrRequest): LoanRepayment[] {
  return ensureSchedule(request)
}

function Overlaps({ request }: { request: HrRequest }) {
  const { t } = useI18n()
  const requests = useStore((state) => state.requests)
  if (!request.start_date || !request.end_date) return null
  const department = getProfile(request.user_id)?.department_id
  const rows = requests.filter(
    (other) =>
      other.request_id !== request.request_id &&
      other.request_type === 'leave' &&
      other.request_status !== 'rejected' &&
      other.start_date &&
      other.end_date &&
      other.start_date <= request.end_date! &&
      other.end_date >= request.start_date! &&
      getProfile(other.user_id)?.department_id === department,
  )
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink-800">{t('rq.ds.overlap')}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-500">{t('rq.ds.noOverlap')}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.request_id} className="flex items-center justify-between gap-3">
              <PersonCell userId={row.user_id} size="xs" subtitle={`${formatDate(row.start_date!)} – ${formatDate(row.end_date!)}`} />
              <StatusBadge value={requestStatusLabels[row.request_status]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DecisionSupport({ request, days }: { request: HrRequest; days: number }) {
  const { t } = useI18n()
  const requests = useStore((state) => state.requests)
  const balances = useStore((state) => state.balances)
  const leave = getLeaveType(request.leave_type_id)
  const balance = leave ? balances.find((item) => item.user_id === request.user_id && item.leave_type_id === leave.leave_type_id) : undefined
  const left = balance ? remaining(balance) : null
  const earlier = requests
    .filter((item) => item.user_id === request.user_id && item.request_id !== request.request_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4)
  return (
    <Panel title={t('rq.ds.title')}>
      <div className="flex flex-col gap-5">
        {leave && request.request_type === 'leave' && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink-800">{t('rq.ds.balance', { type: leave.type_name })}</p>
            {left === null ? (
              <p className="text-sm text-ink-500">{t('rq.ds.noBalance')}</p>
            ) : (
              <>
                <p className="tabular text-base text-ink-900">{t('rq.ds.balanceLine', { left, need: days })}</p>
                {leave.payment_type !== 'unpaid' && <p className={left - days < 0 ? 'mt-1 text-sm font-medium text-danger' : 'mt-1 text-sm text-ink-600'}>{t('rq.ds.balanceAfter', { n: left - days })}</p>}
              </>
            )}
          </div>
        )}
        <Overlaps request={request} />
        <div>
          <p className="mb-2 text-sm font-medium text-ink-800">{t('rq.ds.history')}</p>
          {earlier.length === 0 ? (
            <p className="text-sm text-ink-500">{t('rq.ds.noHistory')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {earlier.map((item) => (
                <li key={item.request_id} className="flex items-center justify-between gap-3 text-sm">
                  <Link to={`/requests/${item.request_id}`} className="min-w-0 truncate text-brand-700 hover:underline">
                    {requestTitle(item)}
                  </Link>
                  <StatusBadge value={requestStatusLabels[item.request_status]} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  )
}

export function RequestDetailPage() {
  const { t } = useI18n()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { role, userId } = useViewer()
  const requests = useStore((state) => state.requests)
  const decide = useDecide()
  const [dialog, setDialog] = useState<'approved' | 'rejected' | 'delete' | null>(null)
  const request = requests.find((item) => item.request_id === Number(id))
  const { status, retry } = useSample(() => request, undefined)

  if (!request) {
    return (
      <Panel>
        <EmptyState icon={FileText} title={t('rq.detail.notFound')} action={<ButtonLink to="/requests" variant="secondary">{t('rq.detail.back')}</ButtonLink>} />
      </Panel>
    )
  }
  if (!visibleRequests(role, userId, requests).some((item) => item.request_id === request.request_id)) return <ForbiddenPage />

  const reviewable = canReview(role, userId, request)
  const leave = getLeaveType(request.leave_type_id)
  const days = request.start_date && request.end_date ? daysBetween(request.start_date, request.end_date) : 0
  const schedule = role === 'hr_admin' && request.request_type === 'loan' && request.request_status === 'approved' ? scheduleFor(request) : []
  const requester = userName(request.user_id)
  const profile = getProfile(request.user_id)
  const pending = request.request_status === 'pending'
  const deletable = pending && (request.user_id === userId || role === 'hr_admin' || (role === 'manager' && teamIds(userId).includes(request.user_id)))
  const kindLabel = leave ? leave.type_name : requestTypeLabels[request.request_type]

  const steps: RichStep[] = [
    { title: t('rq.step.submitted', { name: requester }), time: formatDateTime(request.created_at), userId: request.user_id, name: requester, state: 'done' },
    pending
      ? { title: t('rq.step.review'), note: t('rq.step.nextHr'), state: 'current' }
      : {
          title: t(request.request_status === 'approved' ? 'rq.detail.approvedBy' : 'rq.detail.rejectedBy', { name: userName(request.reviewed_by) }),
          userId: request.reviewed_by ?? undefined,
          name: userName(request.reviewed_by),
          state: 'done',
          tone: request.request_status === 'approved' ? 'success' : 'danger',
        },
    ...(pending ? [{ title: t('rq.step.done'), state: 'next' as const }] : []),
  ]

  const stats = [
    { label: t('rq.stat.type'), value: kindLabel },
    ...(request.start_date ? [{ label: t('rq.stat.period'), value: request.start_date === request.end_date ? formatDate(request.start_date) : `${formatDate(request.start_date)} – ${formatDate(request.end_date)}` }] : []),
    ...(days > 0 ? [{ label: t('rq.stat.duration'), value: t('rq.days', { n: days }) }] : []),
    ...(request.loan_amount ? [{ label: t('rq.stat.amount'), value: formatMoney(request.loan_amount) }, { label: t('rq.stat.monthly'), value: formatMoney(monthlyInstallment(request.loan_amount, request.repayment_period ?? 1)) }] : []),
    { label: t('rq.stat.submitted'), value: formatDate(request.created_at) },
  ].slice(0, 4)

  const closeDialog = () => {
    setDialog(null)
  }

  const confirm = () => {
    if (dialog === 'delete') {
      removeRequest(request.request_id, userId)
      toast.success(t('rq.detail.deleted'))
      navigate('/requests')
    } else if (dialog) {
      decide(request.request_id, dialog)
    }
    closeDialog()
  }

  return (
    <div>
      <BackLink to={reviewable ? '/requests/approvals' : '/requests'} label={t('rq.detail.back')} />
      <DetailHero
        name={requester}
        src={getUser(request.user_id)?.profile_image}
        userId={request.user_id}
        eyebrow={t('rq.detail.title', { id: request.request_id })}
        position={profile?.position}
        department={departments.find((item) => item.department_id === profile?.department_id)?.department_name}
        personTo={role === 'hr_admin' ? `/employees/${request.user_id}` : `/org-chart/${request.user_id}`}
        badge={<StatusBadge value={requestStatusLabels[request.request_status]} />}
        stats={stats}
      />
      <DetailGrid
        main={
          <>
            <Panel title={requestTitle(request)}>
              <DescriptionList
                columns={2}
                items={[
                  { label: t('rq.detail.reason'), value: request.reason, wide: true },
                  ...(request.attachment ? [{ label: t('rq.detail.attachment'), value: <span className="inline-flex items-center gap-2 rounded-control border border-ink-200 px-3 py-1.5 text-sm" dir="ltr"><FileText className="size-4 text-danger" strokeWidth={1.75} />{request.attachment}</span>, wide: true }] : []),
                  ...(request.loan_amount ? [{ label: t('rq.detail.installments'), value: request.repayment_period }] : []),
                  ...(request.reviewed_by ? [{ label: t('rq.detail.reviewer'), value: <PersonCell userId={request.reviewed_by} size="xs" /> }] : []),
                ]}
              />
            </Panel>
            {schedule.length > 0 && (
              <Panel title={t('rq.detail.schedule')} flush>
                <DataTable
                  status={status === 'error' ? 'error' : 'ready'}
                  onRetry={retry}
                  rows={schedule}
                  rowKey={(row) => row.repayment_id}
                  columns={[
                    { key: 'no', header: t('rq.rep.no'), mobile: 'primary', cell: (row) => <span className="tabular font-medium">{row.installment_no}</span> },
                    { key: 'due', header: t('rq.rep.due'), cell: (row) => <span className="tabular">{formatDate(row.due_date)}</span> },
                    { key: 'amount', header: t('rq.rep.amount'), cell: (row) => <span className="tabular">{formatMoney(row.amount)}</span> },
                    { key: 'status', header: t('rq.rep.status'), mobile: 'aside', cell: (row) => <StatusBadge value={repaymentStatusLabels[row.repayment_status]} /> },
                  ]}
                />
              </Panel>
            )}
            {reviewable && pending && <DecisionSupport request={request} days={days} />}
          </>
        }
        side={
          <>
            <Panel title={t('rq.detail.status')}>
              <RichTimeline steps={steps} />
            </Panel>
          </>
        }
      />
      <ActionBar>
        {deletable && (
          <Button variant="ghost" icon={Trash2} onClick={() => setDialog('delete')}>
            {t('rq.detail.cancel')}
          </Button>
        )}
        <DiscussButton record={{ type: 'request', id: request.request_id }} />
        {reviewable && pending && (
          <>
            <Button variant="dangerOutline" icon={XCircle} onClick={() => setDialog('rejected')}>
              {t('act.reject')}
            </Button>
            <Button icon={CheckCircle2} onClick={() => setDialog('approved')}>
              {t('act.approve')}
            </Button>
          </>
        )}
      </ActionBar>
      <ConfirmDialog
        open={dialog !== null}
        onClose={closeDialog}
        onConfirm={confirm}
        title={dialog === 'delete' ? t('rq.detail.cancelTitle') : t(dialog === 'rejected' ? 'rq.review.rejectTitle' : 'rq.review.approveTitle')}
        description={dialog === 'delete' ? t('rq.detail.cancelDesc') : t(dialog === 'rejected' ? 'rq.review.rejectDesc' : 'rq.review.approveDesc', { name: requester })}
        confirmLabel={dialog === 'delete' ? t('act.delete') : t(dialog === 'rejected' ? 'act.reject' : 'act.approve')}
        tone={dialog === 'rejected' || dialog === 'delete' ? 'danger' : 'primary'}
      />
    </div>
  )
}
