import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ClipboardList, FileX2, Layers, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n'
import { formatDate } from '@/lib/format'
import { planStatusLabels } from '@/lib/labels'
import { TODAY } from '@/lib/dates'
import { useViewer } from '@/app/viewer-context'
import { Badge, Button, ButtonLink, ConfirmDialog, DataTable, EmptyState, Field, IconButton, Input, Modal, PageHeader, Panel, Progress, Select, StatusBadge, Switch, Textarea, useToast } from '@/components/ui'
import { ListPanel, RowActions } from '@/components/shared/ListKit'
import { useList, type FilterDef } from '@/components/shared/useList'
import { PersonCell } from '@/components/shared/Person'
import { setPlanStatusAction } from '@/store'
import { bump, useTick } from '@/store/collections'
import { departmentOptions, departments, employeeRow } from '@/features/employees/data'
import type { EvaluationPlan } from '@/types/entities'
import { categories, deleteCategoryData, deletePlanData, getCategory, plans, reviewsInPlan, saveCategoryData, savePlanData, type PlanDraft } from './data'

const scope = (plan: EvaluationPlan, all: string) => departments.find((d) => d.department_id === plan.department_id)?.department_name ?? all

export function PlansPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { role } = useViewer()
  const tick = useTick('performance')
  void tick
  const filters: FilterDef<EvaluationPlan>[] = [{ key: 'status', label: t('k.status'), allLabel: t('k.allStatuses'), options: (['draft', 'active', 'closed'] as const).map((value) => ({ value, label: planStatusLabels[value].label })), test: (p, v) => p.plan_status === v }]
  const list = useList({ rows: plans.slice(), filters, search: (p) => p.plan_name, sorters: { name: (a, b) => a.plan_name.localeCompare(b.plan_name), period: (a, b) => a.period_start.localeCompare(b.period_start) }, initialSort: { key: 'period', dir: 'desc' } })
  const change = (plan: EvaluationPlan, status: 'active' | 'closed') => {
    const n = setPlanStatusAction(plan.plan_id, status)
    toast.success(status === 'active' ? t('pf.plan.activated', { n }) : t('pf.plan.closed'))
  }
  return (
    <div>
      <PageHeader title={t('pf.plan.title')} actions={role === 'hr_admin' && <ButtonLink to="/performance/plans/new" icon={Plus}>{t('pf.plan.add')}</ButtonLink>} />
      <ListPanel
        noun="plan"
        list={list}
        searchPlaceholder={t('pf.plan.search')}
        caption={t('pf.plan.title')}
        rowKey={(p) => p.plan_id}
        rowHref={(p) => `/performance/plans/${p.plan_id}`}
        rowLabel={(p) => p.plan_name}
        empty={<EmptyState icon={ClipboardList} title={t('pf.plan.empty')} />}
        columns={[
          { key: 'name', header: t('pf.plan.name'), mobile: 'primary', sortable: true, cell: (p) => <span className="font-medium text-ink-900">{p.plan_name}</span> },
          { key: 'period', header: t('pf.plan.period'), sortable: true, mobile: 'hidden', cell: (p) => <span className="tabular text-ink-600">{formatDate(p.period_start)} – {formatDate(p.period_end)}</span> },
          { key: 'scope', header: t('pf.plan.scope'), mobile: 'hidden', cell: (p) => scope(p, t('pf.plan.all')) },
          { key: 'progress', header: t('pf.plan.progress'), cell: (p) => { const r = reviewsInPlan(p.plan_id); const done = r.filter((x) => x.review_status === 'submitted').length; return r.length ? <Progress value={(done / r.length) * 100} showValue label={p.plan_name} className="w-32" /> : <span className="text-ink-400">—</span> } },
          { key: 'status', header: t('k.status'), mobile: 'aside', cell: (p) => <StatusBadge value={planStatusLabels[p.plan_status]} /> },
          ...(role === 'hr_admin' ? [{ key: 'actions', header: <span className="sr-only">{t('k.actions')}</span>, mobile: 'hidden' as const, align: 'end' as const, cell: (p: EvaluationPlan) => <RowActions actions={[{ label: t('k.view'), to: `/performance/plans/${p.plan_id}` }, ...(p.plan_status === 'draft' ? [{ label: t('act.edit'), to: `/performance/plans/${p.plan_id}/edit` }, { label: t('pf.plan.activate'), onSelect: () => change(p, 'active') }] : []), ...(p.plan_status === 'active' ? [{ label: t('pf.plan.close'), onSelect: () => change(p, 'closed') }] : [])]} /> }] : []),
        ]}
      />
    </div>
  )
}

export function PlanDetailPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { role } = useViewer()
  const tick = useTick('performance')
  void tick
  const navigate = useNavigate()
  const [deletingPlan, setDeletingPlan] = useState(false)
  const planId = Number(useParams().id)
  const plan = plans.find((p) => p.plan_id === planId)
  if (!plan) return <EmptyState icon={FileX2} title={t('k.notFound')} action={<ButtonLink to="/performance/plans" variant="secondary">{t('pf.plan.back')}</ButtonLink>} />
  const reviews = reviewsInPlan(plan.plan_id)
  const change = (status: 'active' | 'closed') => {
    const n = setPlanStatusAction(plan.plan_id, status)
    toast.success(status === 'active' ? t('pf.plan.activated', { n }) : t('pf.plan.closed'))
  }
  return (
    <div>
      <PageHeader
        title={plan.plan_name}
        description={plan.description}
        meta={<><StatusBadge value={planStatusLabels[plan.plan_status]} /><span className="tabular text-sm text-ink-500">{formatDate(plan.period_start)} – {formatDate(plan.period_end)}</span></>}
        actions={<><ButtonLink to="/performance/plans" variant="secondary">{t('pf.plan.back')}</ButtonLink>{role === 'hr_admin' && plan.plan_status === 'draft' && <><Button variant="ghost" onClick={() => setDeletingPlan(true)}>{t('act.delete')}</Button><ButtonLink to={`/performance/plans/${plan.plan_id}/edit`} variant="secondary">{t('act.edit')}</ButtonLink><Button onClick={() => change('active')}>{t('pf.plan.activate')}</Button></>}{role === 'hr_admin' && plan.plan_status === 'active' && <Button variant="secondary" onClick={() => change('closed')}>{t('pf.plan.close')}</Button>}</>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel flush title={t('pf.plan.criteria')} description={t('pf.plan.weightTotal', { n: plan.criteria.reduce((sum, c) => sum + c.weight, 0) })}>
          <DataTable rows={plan.criteria} rowKey={(c) => c.criteria_id} caption={t('pf.plan.criteria')} columns={[
            { key: 'text', header: t('pf.crit.text'), mobile: 'primary', cell: (c) => <span className="block max-w-xs">{c.criteria_text}</span> },
            { key: 'cat', header: t('pf.crit.category'), mobile: 'hidden', cell: (c) => <Badge>{getCategory(c.category_id)?.category_name}</Badge> },
            { key: 'w', header: t('pf.crit.weight'), mobile: 'aside', cell: (c) => <span className="tabular">{c.weight}%</span> },
          ]} />
        </Panel>
        <Panel flush title={t('pf.plan.reviews')}>
          <DataTable rows={reviews} rowKey={(r) => r.review_id} rowHref={(r) => (r.review_status === 'submitted' ? `/performance/reviews/${r.review_id}` : '/performance/reviews')} rowLabel={(r) => employeeRow(r.reviewed_user_id)?.name ?? ''} caption={t('pf.plan.reviews')} empty={<EmptyState compact icon={ClipboardList} title={t('pf.rev.empty')} />} columns={[
            { key: 'p', header: t('pf.rev.reviewee'), mobile: 'primary', cell: (r) => <PersonCell userId={r.reviewed_user_id} compact /> },
            { key: 's', header: t('pf.rev.score'), cell: (r) => <span className="tabular">{r.final_percentage == null ? '—' : `${r.final_percentage}%`}</span> },
            { key: 'st', header: t('pf.rev.status'), mobile: 'aside', cell: (r) => <Badge tone={r.review_status === 'submitted' ? 'success' : 'warning'} dot>{r.review_status === 'submitted' ? t('pf.rev.submitted') : t('pf.rev.pending')}</Badge> },
          ]} />
        </Panel>
      </div>
      <ConfirmDialog open={deletingPlan} onClose={() => setDeletingPlan(false)} onConfirm={() => { deletePlanData(plan.plan_id); bump('performance'); toast.success(t('pf.plan.deleted')); navigate('/performance/plans') }} title={t('pf.plan.deleteTitle')} description={t('pf.plan.deleteDesc')} confirmLabel={t('act.delete')} tone="danger" />
    </div>
  )
}

interface CriterionRow {
  category: string
  text: string
  weight: string
  max: string
}

export function PlanFormPage() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { userId } = useViewer()
  const id = Number(useParams().id) || undefined
  const existing = plans.find((p) => p.plan_id === id)
  const [name, setName] = useState(existing?.plan_name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [department, setDepartment] = useState(String(existing?.department_id ?? ''))
  const [dates, setDates] = useState({ ps: existing?.period_start ?? TODAY, pe: existing?.period_end ?? TODAY, ss: existing?.submission_start ?? TODAY, se: existing?.submission_end ?? TODAY })
  const [rows, setRows] = useState<CriterionRow[]>(existing?.criteria.map((c) => ({ category: String(c.category_id), text: c.criteria_text, weight: String(c.weight), max: String(c.max_score) })) ?? [{ category: '1', text: '', weight: '100', max: '5' }])
  const [errors, setErrors] = useState<Record<string, string>>({})
  if (id && (!existing || existing.plan_status !== 'draft')) return <EmptyState icon={FileX2} title={t('k.notFound')} description={existing ? t('pf.plan.onlyDraft') : t('k.notFoundDesc')} action={<ButtonLink to="/performance/plans" variant="secondary">{t('pf.plan.back')}</ButtonLink>} />
  const total = rows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0)
  const setRow = (index: number, patch: Partial<CriterionRow>) => setRows((old) => old.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = t('k.required')
    else if (name.trim().length > 150) next.name = t('em.form.tooLong', { n: 150 })
    if (dates.pe < dates.ps || dates.se < dates.ss) next.dates = t('k.invalidRange')
    if (rows.some((row) => !row.text.trim() || row.text.trim().length > 255 || !(Number(row.weight) >= 0.01 && Number(row.weight) <= 100) || !(Number.isInteger(Number(row.max)) && Number(row.max) >= 1 && Number(row.max) <= 10))) next.criteria = t('pf.plan.criteriaError')
    else if (total !== 100) next.criteria = t('pf.plan.weightError')
    setErrors(next)
    if (Object.keys(next).length) return
    const draft: PlanDraft = { name: name.trim(), description: description.trim(), department: department ? Number(department) : null, periodStart: dates.ps, periodEnd: dates.pe, submissionStart: dates.ss, submissionEnd: dates.se, criteria: rows.map((row) => ({ category: Number(row.category), text: row.text.trim(), weight: Number(row.weight), max: Number(row.max) })) }
    const planId = savePlanData(draft, userId, id)
    bump('performance')
    toast.success(id ? t('pf.plan.saved') : t('pf.plan.created', { name: draft.name }))
    navigate(`/performance/plans/${planId}`)
  }
  return (
    <div>
      <PageHeader title={id ? t('pf.plan.edit') : t('pf.plan.add')} />
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('pf.plan.name')} required error={errors.name}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label={t('pf.plan.scope')}><Select value={department} onChange={(e) => setDepartment(e.target.value)} options={[{ value: '', label: t('pf.plan.all') }, ...departmentOptions()]} /></Field>
            <Field label={t('pf.plan.desc2')} className="sm:col-span-2" optional><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            <Field label={t('pf.plan.periodStart')}><Input type="date" value={dates.ps} onChange={(e) => setDates({ ...dates, ps: e.target.value })} /></Field>
            <Field label={t('pf.plan.periodEnd')} error={errors.dates}><Input type="date" value={dates.pe} onChange={(e) => setDates({ ...dates, pe: e.target.value })} /></Field>
            <Field label={t('pf.plan.subStart')}><Input type="date" value={dates.ss} onChange={(e) => setDates({ ...dates, ss: e.target.value })} /></Field>
            <Field label={t('pf.plan.subEnd')}><Input type="date" value={dates.se} onChange={(e) => setDates({ ...dates, se: e.target.value })} /></Field>
          </div>
        </Panel>
        <Panel title={t('pf.plan.criteria')} description={t('pf.plan.weightTotal', { n: total })} actions={<Button type="button" size="sm" variant="secondary" icon={Plus} onClick={() => setRows((old) => [...old, { category: '1', text: '', weight: '', max: '5' }])}>{t('pf.plan.addCriterion')}</Button>}>
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li key={index} className="grid gap-2 rounded-xl border border-ink-200/80 p-3 sm:grid-cols-[1fr_10rem_6rem_6rem_auto] sm:items-end">
                <Field label={t('pf.crit.text')}><Input value={row.text} onChange={(e) => setRow(index, { text: e.target.value })} /></Field>
                <Field label={t('pf.crit.category')}><Select value={row.category} onChange={(e) => setRow(index, { category: e.target.value })} options={categories.filter((c) => c.is_active).map((c) => ({ value: c.category_id, label: c.category_name }))} /></Field>
                <Field label={t('pf.crit.weight')}><Input type="number" min="0" value={row.weight} onChange={(e) => setRow(index, { weight: e.target.value })} /></Field>
                <Field label={t('pf.crit.max')}><Input type="number" min="1" value={row.max} onChange={(e) => setRow(index, { max: e.target.value })} /></Field>
                <IconButton icon={Trash2} label={t('act.remove')} disabled={rows.length === 1} onClick={() => setRows((old) => old.filter((_, i) => i !== index))} />
              </li>
            ))}
          </ul>
          {errors.criteria && <p role="alert" className="mt-3 text-sm text-danger">{errors.criteria}</p>}
        </Panel>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>{t('k.cancel')}</Button>
          <Button type="submit">{t('act.save')}</Button>
        </div>
      </form>
    </div>
  )
}

export function CategoriesPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { role } = useViewer()
  const tick = useTick('performance')
  void tick
  const [editing, setEditing] = useState<(typeof categories)[number] | null | undefined>(undefined)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [error, setError] = useState('')
  const [removingCat, setRemovingCat] = useState<(typeof categories)[number] | null>(null)
  const open = (category: (typeof categories)[number] | null) => {
    setEditing(category)
    setName(category?.category_name ?? '')
    setDescription(category?.description ?? '')
    setActive(category?.is_active ?? true)
    setError('')
  }
  const usage = (id: number) => plans.reduce((sum, plan) => sum + plan.criteria.filter((c) => c.category_id === id).length, 0)
  const list = useList({ rows: categories.slice(), search: (c) => `${c.category_name} ${c.description ?? ''}`, sorters: { name: (a, b) => a.category_name.localeCompare(b.category_name) } })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return setError(t('k.required'))
    if (name.trim().length > 100) return setError(t('em.form.tooLong', { n: 100 }))
    saveCategoryData(name.trim(), description.trim(), active, editing?.category_id)
    bump('performance')
    toast.success(t('pf.cat.saved'))
    setEditing(undefined)
  }
  return (
    <div>
      <PageHeader title={t('pf.cat.title')} actions={role === 'hr_admin' && <Button icon={Plus} onClick={() => open(null)}>{t('pf.cat.add')}</Button>} />
      <ListPanel
        noun="category"
        list={list}
        searchPlaceholder={t('pf.crit.search')}
        caption={t('pf.cat.title')}
        rowKey={(c) => c.category_id}
        empty={<EmptyState icon={Layers} title={t('pf.cat.empty')} />}
        columns={[
          { key: 'name', header: t('pf.cat.name'), mobile: 'primary', sortable: true, cell: (c) => <span className="font-medium text-ink-900">{c.category_name}</span> },
          { key: 'desc', header: t('pf.cat.description'), mobile: 'hidden', cell: (c) => <span className="block max-w-sm truncate text-ink-600">{c.description}</span> },
          { key: 'usage', header: t('pf.cat.usage'), mobile: 'hidden', cell: (c) => <span className="tabular">{t('pf.cat.used', { n: usage(c.category_id) })}</span> },
          { key: 'status', header: t('k.status'), mobile: 'aside', cell: (c) => <Badge tone={c.is_active ? 'success' : 'neutral'} dot>{c.is_active ? t('k.active') : t('k.inactive')}</Badge> },
          ...(role === 'hr_admin' ? [{ key: 'actions', header: <span className="sr-only">{t('k.actions')}</span>, mobile: 'hidden' as const, align: 'end' as const, cell: (c: (typeof categories)[number]) => <RowActions actions={[{ label: t('act.edit'), onSelect: () => open(c) }, { label: t('act.delete'), tone: 'danger', onSelect: () => setRemovingCat(c) }]} /> }] : []),
        ]}
      />
      <ConfirmDialog
        open={removingCat !== null}
        onClose={() => setRemovingCat(null)}
        onConfirm={() => {
          if (removingCat) deleteCategoryData(removingCat.category_id)
          bump('performance')
          toast.success(t('pf.cat.deleted'))
          setRemovingCat(null)
        }}
        title={t('pf.cat.deleteTitle')}
        description={t('pf.cat.deleteDesc')}
        confirmLabel={t('act.delete')}
        tone="danger"
      />
      {editing !== undefined && (
        <Modal open onClose={() => setEditing(undefined)} title={editing ? t('pf.cat.edit') : t('pf.cat.add')} footer={<><Button variant="secondary" onClick={() => setEditing(undefined)}>{t('k.cancel')}</Button><Button type="submit" form="cat-form">{t('act.save')}</Button></>}>
          <form id="cat-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
            <Field label={t('pf.cat.name')} required error={error}><Input value={name} onChange={(e) => { setName(e.target.value); setError('') }} /></Field>
            <Field label={t('pf.cat.description')} optional><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            <Switch checked={active} onChange={setActive} label={t('pf.cat.active')} />
          </form>
        </Modal>
      )}
    </div>
  )
}
