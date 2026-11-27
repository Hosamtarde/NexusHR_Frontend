import { useMemo, useState } from 'react'
import { CalendarDays, FilePlus2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n'
import { localize } from '@/i18n/localized'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { paymentTypeLabels } from '@/lib/labels'
import { paginate, usePageParam, useQueryParam, useSample } from '@/lib/sample'
import type { LeaveBalance, LeaveType, PaymentType } from '@/types/entities'
import { useViewer } from '@/app/viewer-context'
import {
  Badge,
  Button,
  ButtonLink,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  FilterBar,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Panel,
  Progress,
  SearchInput,
  Select,
  Skeleton,
  Switch,
  useToast,
} from '@/components/ui'
import { PersonCell } from '@/components/shared/Person'
import { userName } from '@/features/employees/data'
import { calculateBalances, nextLeaveTypeId, removeLeaveType, saveLeaveType, updateBalance, useStore } from '@/store'
import { LOW_BALANCE_THRESHOLD, remaining } from './data'

const limit = 10

export function LeaveBalancesPage() {
  const { t } = useI18n()
  const balances = useStore((state) => state.balances)
  const leaveTypes = useStore((state) => state.leaveTypes)
  const [q, setQ] = useQueryParam('q')
  const [type, setType] = useQueryParam('type')
  const [page, setPage] = usePageParam()
  const [yearFilter, setYearFilter] = useQueryParam('year', '2026')
  const [editing, setEditing] = useState<LeaveBalance | null>(null)
  const [calculating, setCalculating] = useState(false)
  const { userId } = useViewer()
  const toast = useToast()
  const { status, data, retry } = useSample(() => balances, [])
  const needle = q.trim().toLowerCase()
  const rows = data.filter((item) => String(item.year) === yearFilter && (!type || String(item.leave_type_id) === type) && (!needle || userName(item.user_id).toLowerCase().includes(needle)))
  const paged = paginate(rows, page, limit)
  const typeName = (id: number) => leaveTypes.find((item) => item.leave_type_id === id)?.type_name ?? '—'

  return (
    <div>
      <PageHeader title={t('lb.title')} actions={<Button variant="secondary" onClick={() => setCalculating(true)}>{t('lb.calc')}</Button>} />
      <Panel flush>
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder={t('lb.search')} className="sm:max-w-xs sm:flex-1" />
          <Select
            aria-label={t('lb.col.type')}
            value={type}
            onChange={(event) => setType(event.target.value)}
            options={[{ value: '', label: t('lb.allTypes') }, ...leaveTypes.map((item) => ({ value: item.leave_type_id, label: item.type_name }))]}
          />
          <Select aria-label={t('lb.year')} value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} options={['2025', '2026', '2027'].map((value) => ({ value, label: value }))} />
        </FilterBar>
        <DataTable
          status={status}
          onRetry={retry}
          rows={paged.items}
          rowKey={(row) => row.balance_id}
          caption={t('lb.title')}
          empty={<EmptyState icon={CalendarDays} title={t('rq.empty.title')} />}
          columns={[
            { key: 'person', header: t('lb.col.employee'), mobile: 'primary', cell: (row) => <PersonCell userId={row.user_id} /> },
            { key: 'type', header: t('lb.col.type'), mobile: 'aside', cell: (row) => typeName(row.leave_type_id) },
            { key: 'total', header: t('lb.col.total'), cell: (row) => <span className="tabular">{row.total_days}</span> },
            { key: 'carried', header: t('lb.col.carried'), cell: (row) => <span className="tabular">{row.carried_over}</span> },
            { key: 'used', header: t('lb.col.used'), cell: (row) => <span className="tabular">{row.used_days}</span> },
            {
              key: 'actions',
              header: <span className="sr-only">{t('k.actions')}</span>,
              mobile: 'hidden',
              align: 'end',
              cell: (row) => <IconButton icon={Pencil} size="sm" label={t('act.edit')} onClick={() => setEditing(row)} />,
            },
            {
              key: 'remaining',
              header: t('lb.col.remaining'),
              cell: (row) => (
                <span className={cn('tabular font-semibold', remaining(row) <= LOW_BALANCE_THRESHOLD ? 'text-warning' : 'text-ink-900')}>{formatNumber(remaining(row))}</span>
              ),
            },
          ]}
        />
        {status === 'ready' && <Pagination noun="balance" page={paged.page} limit={limit} total={paged.total} onChange={setPage} />}
      </Panel>
      {editing && <BalanceModal key={editing.balance_id} balance={editing} name={userName(editing.user_id)} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={calculating}
        onClose={() => setCalculating(false)}
        onConfirm={() => {
          const n = calculateBalances(Number(yearFilter), userId)
          toast.success(t('lb.calcDone', { n }))
          setCalculating(false)
        }}
        title={t('lb.calcTitle', { year: yearFilter })}
        description={t('lb.calcDesc')}
        confirmLabel={t('act.confirm')}
      />
    </div>
  )
}

function BalanceModal({ balance, name, onClose }: { balance: LeaveBalance; name: string; onClose: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const { userId } = useViewer()
  const [form, setForm] = useState({ total: String(balance.total_days), carried: String(balance.carried_over), used: String(balance.used_days) })
  const [touched, setTouched] = useState(false)
  const valid = (value: string) => value !== '' && Number(value) >= 0 && Number(value) <= 365 && Math.round(Number(value) * 10) === Number(value) * 10
  const ok = valid(form.total) && valid(form.carried) && valid(form.used)
  const save = () => {
    setTouched(true)
    if (!ok) return
    updateBalance(balance.balance_id, { total_days: Number(form.total), carried_over: Number(form.carried), used_days: Number(form.used) }, userId)
    toast.success(t('lb.saved', { name }))
    onClose()
  }
  const field = (key: 'total' | 'carried' | 'used', label: string) => (
    <Field label={label} error={touched && !valid(form[key]) ? t('lb.errRange') : undefined}>
      <Input type="number" min="0" max="365" step="0.1" value={form[key]} onChange={(event) => setForm((old) => ({ ...old, [key]: event.target.value }))} />
    </Field>
  )
  return (
    <Modal
      open
      onClose={onClose}
      title={t('lb.editTitle', { name })}
      description={t('lb.editDesc')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('act.cancel')}</Button>
          <Button onClick={save}>{t('act.save')}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {field('total', t('lb.col.total'))}
        {field('carried', t('lb.col.carried'))}
        {field('used', t('lb.col.used'))}
      </div>
    </Modal>
  )
}

function BalanceCard({ balance, name }: { balance: LeaveBalance; name: string }) {
  const { t } = useI18n()
  const entitled = balance.total_days + balance.carried_over
  const left = remaining(balance)
  const low = left <= LOW_BALANCE_THRESHOLD
  return (
    <div className="rounded-surface border border-ink-200/80 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-md font-semibold text-ink-900">{name}</h3>
        {low && <Badge tone="warning" dot>{t('lb.low')}</Badge>}
      </div>
      <p className="tabular mt-4 text-3xl font-bold tracking-tight text-ink-900">
        {formatNumber(left)}
        <span className="ms-2 text-sm font-medium text-ink-500">{t('lb.of', { n: entitled })}</span>
      </p>
      <Progress className="mt-4" value={entitled ? (balance.used_days / entitled) * 100 : 0} tone={low ? 'warning' : 'brand'} label={name} />
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        {[
          [t('lb.total'), balance.total_days],
          [t('lb.carried'), balance.carried_over],
          [t('lb.used'), balance.used_days],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-ink-500">{label}</dt>
            <dd className="tabular mt-0.5 font-semibold text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function MyBalancePage() {
  const { t } = useI18n()
  const { userId } = useViewer()
  const balances = useStore((state) => state.balances)
  const leaveTypes = useStore((state) => state.leaveTypes)
  const mine = useMemo(() => balances.filter((item) => item.user_id === userId), [balances, userId])
  const { status, data } = useSample(() => mine, [])

  return (
    <div>
      <PageHeader
        title={t('lb.me.title')}
       
        actions={
          <ButtonLink to="/requests/new" icon={FilePlus2}>
            {t('lb.newRequest')}
          </ButtonLink>
        }
      />
      {status === 'loading' ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-52 rounded-surface" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Panel>
          <EmptyState icon={CalendarDays} title={t('rq.empty.title')} />
        </Panel>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.map((balance) => (
            <BalanceCard key={balance.balance_id} balance={balance} name={leaveTypes.find((item) => item.leave_type_id === balance.leave_type_id)?.type_name ?? '—'} />
          ))}
        </div>
      )}
    </div>
  )
}

interface TypeForm {
  nameAr: string
  nameEn: string
  payment: PaymentType
  days: string
  tiers: boolean
}

function TypeModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: LeaveType | null }) {
  const { t } = useI18n()
  const toast = useToast()
  const [touched, setTouched] = useState(false)
  const [form, setForm] = useState<TypeForm>(() => ({
    nameAr: editing ? editing.type_name : '',
    nameEn: editing ? editing.type_name : '',
    payment: editing?.payment_type ?? 'paid',
    days: String(editing?.default_days ?? 14),
    tiers: editing?.uses_service_tiers ?? false,
  }))
  const set = (patch: Partial<TypeForm>) => setForm((current) => ({ ...current, ...patch }))
  const daysOk = form.days !== '' && Number.isInteger(Number(form.days)) && Number(form.days) >= 0 && Number(form.days) <= 365
  const lengthOk = (value: string) => value.trim().length >= 2 && value.trim().length <= 100
  const invalid = !lengthOk(form.nameAr) || !lengthOk(form.nameEn) || !daysOk

  const submit = () => {
    setTouched(true)
    if (invalid) return
    const base: LeaveType = {
      leave_type_id: editing?.leave_type_id ?? nextLeaveTypeId(),
      type_name: form.nameAr.trim(),
      payment_type: form.payment,
      default_days: Number(form.days),
      uses_service_tiers: form.tiers,
      created_at: editing?.created_at ?? new Date().toISOString(),
    }
    saveLeaveType(localize(base, { type_name: { ar: form.nameAr.trim(), en: form.nameEn.trim() } }))
    toast.success(t('lt.saved'))
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('lt.edit') : t('lt.new')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('act.cancel')}
          </Button>
          <Button onClick={submit}>{t('act.save')}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('lt.nameAr')} error={touched && !lengthOk(form.nameAr) ? t('lt.errLength') : undefined}>
          <Input value={form.nameAr} onChange={(event) => set({ nameAr: event.target.value })} dir="rtl" />
        </Field>
        <Field label={t('lt.nameEn')} error={touched && !lengthOk(form.nameEn) ? t('lt.errLength') : undefined}>
          <Input value={form.nameEn} onChange={(event) => set({ nameEn: event.target.value })} dir="ltr" />
        </Field>
        <Field label={t('lt.payment')}>
          <Select value={form.payment} onChange={(event) => set({ payment: event.target.value as PaymentType })} options={(['paid', 'half_paid', 'unpaid'] as const).map((value) => ({ value, label: paymentTypeLabels[value] }))} />
        </Field>
        <Field label={t('lt.days')} error={touched && !daysOk ? t('lb.errRange') : undefined}>
          <Input type="number" value={form.days} onChange={(event) => set({ days: event.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Switch checked={form.tiers} onChange={(value) => set({ tiers: value })} label={t('lt.tiers')} />
        </div>
      </div>
    </Modal>
  )
}

export function LeaveTypesPage() {
  const { t } = useI18n()
  const toast = useToast()
  const leaveTypes = useStore((state) => state.leaveTypes)
  const { status, data, retry } = useSample(() => leaveTypes, [])
  const [editing, setEditing] = useState<LeaveType | null>(null)
  const [open, setOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [removing, setRemoving] = useState<LeaveType | null>(null)

  const show = (type: LeaveType | null) => {
    setEditing(type)
    setModalKey((value) => value + 1)
    setOpen(true)
  }

  return (
    <div>
      <PageHeader
        title={t('lt.title')}
       
        actions={
          <Button icon={Plus} onClick={() => show(null)}>
            {t('lt.add')}
          </Button>
        }
      />
      <Panel flush>
        <DataTable
          status={status}
          onRetry={retry}
          rows={data}
          rowKey={(row) => row.leave_type_id}
          caption={t('lt.title')}
          empty={<EmptyState icon={CalendarDays} title={t('lt.empty')} action={<Button icon={Plus} onClick={() => show(null)}>{t('lt.add')}</Button>} />}
          columns={[
            { key: 'name', header: t('lt.col.name'), mobile: 'primary', cell: (row) => <span className="font-medium text-ink-900">{row.type_name}</span> },
            { key: 'payment', header: t('lt.col.payment'), mobile: 'aside', cell: (row) => <Badge tone={row.payment_type === 'paid' ? 'success' : row.payment_type === 'half_paid' ? 'warning' : 'neutral'} dot>{paymentTypeLabels[row.payment_type]}</Badge> },
            { key: 'days', header: t('lt.col.days'), cell: (row) => <span className="tabular">{row.default_days}</span> },
            { key: 'tiers', header: t('lt.col.tiers'), cell: (row) => (row.uses_service_tiers ? t('lt.tiersYes') : t('lt.tiersNo')) },
            {
              key: 'actions',
              header: <span className="sr-only">{t('rq.col.actions')}</span>,
              align: 'end',
              mobile: 'hidden',
              cell: (row) => (
                <span className="flex justify-end gap-1">
                  <IconButton icon={Pencil} size="sm" label={t('act.edit')} onClick={() => show(row)} />
                  <IconButton icon={Trash2} size="sm" label={t('act.delete')} onClick={() => setRemoving(row)} />
                </span>
              ),
            },
          ]}
        />
      </Panel>
      <TypeModal key={modalKey} open={open} onClose={() => setOpen(false)} editing={editing} />
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) removeLeaveType(removing.leave_type_id)
          toast.success(t('lt.deleted'))
          setRemoving(null)
        }}
        title={t('lt.deleteTitle')}
        description={t('lt.deleteDesc')}
        confirmLabel={t('act.delete')}
        tone="danger"
      />
    </div>
  )
}
