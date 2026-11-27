import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, ChevronLeft, ListChecks, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { TODAY, fromIso } from '@/lib/dates'
import { formatDate, formatDateTime } from '@/lib/format'
import { taskPriorityLabels, taskStatusLabels } from '@/lib/labels'
import { paginate, usePageParam, useQueryParam, useSample } from '@/lib/sample'
import type { TaskPriority, TaskStatus } from '@/types/entities'
import { useViewer } from '@/app/viewer-context'
import { Badge, Button, ButtonLink, ConfirmDialog, MenuItem, Popover, DescriptionList, EmptyState, Field, FilterBar, Input, Modal, PageHeader, Pagination, Panel, Progress, SearchInput, Select, StatusBadge, Textarea, useToast } from '@/components/ui'
import { PersonCell, PersonStack } from '@/components/shared/Person'
import { DetailGrid, RichTimeline, type RichStep } from '@/components/shared/DetailLayout'
import { DiscussButton } from '@/features/messages/records'
import { removeTask, setTaskStatus, updateProgress, updateTask, useStore } from '@/store'
import { getProfile, teamIds, userName } from '@/features/employees/data'
import { getSkill } from '@/features/skills/data'
import { ForbiddenPage } from '@/features/system/ErrorPages'
import { assigneesOf, isOverdue, progressOf, requiredSkills, tasksAssignedTo, visibleTasks } from './data'
import { TaskList } from './TaskList'
import { TaskComposer } from './TaskComposer'

type Mode = 'all' | 'mine' | 'team'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-surface border border-ink-200/80 bg-white p-5 shadow-card">
      <p className="mb-2 text-sm text-ink-500">{label}</p>
      {children}
    </div>
  )
}

const limit = 10

function TasksListPage({ mode }: { mode: Mode }) {
  const { t } = useI18n()
  const { role, userId } = useViewer()
  const tasks = useStore((state) => state.tasks)
  const assignments = useStore((state) => state.assignments)
  const [q, setQ] = useQueryParam('q')
  const [statusFilter, setStatusFilter] = useQueryParam('status')
  const [priorityFilter, setPriorityFilter] = useQueryParam('priority')
  const [createdFilter, setCreatedFilter] = useQueryParam('created')
  const [page, setPage] = usePageParam()

  const base = useMemo(() => {
    const list = mode === 'mine' ? tasksAssignedTo(userId, tasks, assignments) : mode === 'team' ? visibleTasks('manager', userId, tasks, assignments) : visibleTasks(role, userId, tasks, assignments)
    return list.slice().sort((a, b) => a.deadline.localeCompare(b.deadline))
  }, [mode, role, userId, tasks, assignments])

  const { status, data, retry } = useSample(() => base, [])
  const needle = q.trim().toLowerCase()
  const filtered = data.filter((task) => {
    if (statusFilter && task.task_status !== statusFilter) return false
    if (priorityFilter && task.task_priority !== priorityFilter) return false
    if (createdFilter === 'me' && task.assigned_by !== userId) return false
    return !needle || task.task_title.toLowerCase().includes(needle)
  })
  const paged = paginate(filtered, page, limit)
  const canCreate = role !== 'employee'

  return (
    <div>
      <PageHeader
        title={t(`ts.${mode}.title` as 'ts.all.title')}
        actions={
          canCreate && (
            <ButtonLink to="/tasks/new" icon={Plus}>
              {t('ts.new')}
            </ButtonLink>
          )
        }
      />
      <Panel flush>
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder={t('ts.search')} className="sm:max-w-xs sm:flex-1" />
          <Select
            aria-label={t('ts.col.status')}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[{ value: '', label: t('ts.allStatuses') }, ...(['to-do', 'in_progress', 'completed', 'cancelled'] as const).map((value) => ({ value, label: taskStatusLabels[value].label }))]}
          />
          <Select
            aria-label={t('ts.col.priority')}
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            options={[{ value: '', label: t('ts.allPriorities') }, ...(['low', 'medium', 'high'] as const).map((value) => ({ value, label: taskPriorityLabels[value].label }))]}
          />
          {mode !== 'mine' && <Select aria-label={t('ts.createdBy')} value={createdFilter} onChange={(event) => setCreatedFilter(event.target.value)} options={[{ value: '', label: t('ts.createdAny') }, { value: 'me', label: t('ts.createdMe') }]} />}
        </FilterBar>
        <TaskList
          rows={paged.items}
          assignments={assignments}
          status={status}
          onRetry={retry}
          empty={<EmptyState icon={ListChecks} title={t(mode === 'mine' ? 'ts.empty.mine' : 'ts.empty.title')} action={canCreate ? <ButtonLink to="/tasks/new" icon={Plus}>{t('ts.new')}</ButtonLink> : undefined} />}
        />
        {status === 'ready' && <Pagination noun="task" page={paged.page} limit={limit} total={paged.total} onChange={setPage} />}
      </Panel>
    </div>
  )
}

export const AllTasksPage = () => <TasksListPage mode="all" />
export const MyTasksPage = () => <TasksListPage mode="mine" />
export const TeamTasksPage = () => <TasksListPage mode="team" />
export const NewTaskPage = () => <TaskComposer />
export const SmartAssignPage = () => <TaskComposer smart />

export function TaskDetailPage() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { id } = useParams()
  const { role, userId } = useViewer()
  const tasks = useStore((state) => state.tasks)
  const assignments = useStore((state) => state.assignments)
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null)
  const [removing, setRemoving] = useState(false)
  const [editingTask, setEditingTask] = useState(false)
  const [draft, setDraft] = useState({ title: '', description: '', deadline: '', priority: 'medium' as TaskPriority })
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({})
  const [value, setValue] = useState<number | null>(null)
  const task = tasks.find((item) => item.task_id === Number(id))

  if (!task) {
    return (
      <Panel>
        <EmptyState icon={ListChecks} title={t('ts.detail.notFound')} action={<ButtonLink to="/tasks/mine" variant="secondary">{t('ts.detail.back')}</ButtonLink>} />
      </Panel>
    )
  }
  if (!visibleTasks(role, userId, tasks, assignments).some((item) => item.task_id === task.task_id)) return <ForbiddenPage />

  const list = assigneesOf(task.task_id, assignments)
  const mine = list.find((item) => item.user_id === userId)
  const canManage = role === 'hr_admin' || (role === 'manager' && (task.assigned_by === userId || list.some((item) => teamIds(userId).includes(item.user_id))))
  const required = requiredSkills[task.task_id] ?? []
  const overall = progressOf(task.task_id, assignments)
  const creator = getProfile(task.assigned_by)
  const closed = task.task_status === 'completed' || task.task_status === 'cancelled'

  const applyStatus = (next: TaskStatus) => {
    const undo = setTaskStatus(task.task_id, next, userId)
    toast.success(t('ts.detail.statusSaved'), taskStatusLabels[next].label, { label: t('ts.undo'), onClick: undo })
  }
  const changeStatus = (next: TaskStatus) => {
    if (next === task.task_status) return
    if (next === 'completed' || next === 'cancelled' || task.task_status === 'completed' || task.task_status === 'cancelled') setPendingStatus(next)
    else applyStatus(next)
  }

  const daysLeft = Math.round((fromIso(task.deadline).getTime() - fromIso(TODAY).getTime()) / 86400000)
  const dueChip = closed ? null : daysLeft < 0 ? <Badge tone="danger">{t('ts.due.overdue')}</Badge> : daysLeft === 0 ? <Badge tone="warning">{t('ts.due.today')}</Badge> : <Badge>{t('ts.due.left', { n: daysLeft })}</Badge>
  const reached = task.task_status === 'to-do' ? 0 : task.task_status === 'completed' ? 2 : 1
  const cancelled = task.task_status === 'cancelled'
  const steps: RichStep[] = [
    { title: t('ts.step.created'), time: formatDateTime(task.created_at), userId: task.assigned_by, name: userName(task.assigned_by), state: 'done' },
    cancelled
      ? { title: taskStatusLabels.cancelled.label, state: 'done', tone: 'danger' }
      : { title: taskStatusLabels.in_progress.label, state: reached >= 2 ? 'done' : reached === 1 ? 'current' : 'next', tone: 'brand' },
    ...(cancelled ? [] : [{ title: taskStatusLabels.completed.label, state: reached === 2 ? ('done' as const) : ('next' as const), tone: 'success' as const }]),
  ]
  const listLabel = role === 'hr_admin' ? 'ts.all.title' : canManage ? 'ts.team.title' : 'ts.mine.title'
  const shown = value ?? mine?.completion_percentage ?? 0

  return (
    <div>
      <nav aria-label={t('nav.breadcrumbs')} className="mb-4 flex items-center gap-2 text-sm text-ink-500">
        <Link to={role === 'hr_admin' ? '/tasks' : canManage ? '/tasks/team' : '/tasks/mine'} className="inline-flex items-center gap-1.5 rounded font-medium text-brand-700 hover:underline">
          <ArrowRight className="size-4 ltr:rotate-180" strokeWidth={1.75} aria-hidden />
          {t(listLabel)}
        </Link>
        <ChevronLeft className="size-3.5 text-ink-300 ltr:rotate-180" strokeWidth={1.75} aria-hidden />
        <span aria-current="page">{t('ts.detail.title', { id: task.task_id })}</span>
      </nav>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-ink-900">{task.task_title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={taskStatusLabels[task.task_status]} />
            <StatusBadge value={taskPriorityLabels[task.task_priority]} />
            {dueChip}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DiscussButton record={{ type: 'task', id: task.task_id }} />
          {canManage && (
            <>
              <Popover
                trigger={({ toggle, open, id }) => (
                  <Button variant="secondary" icon={RefreshCw} onClick={toggle} aria-haspopup="menu" aria-expanded={open} aria-controls={id}>
                    {t('ts.detail.status')}
                  </Button>
                )}
              >
                {(close) =>
                  (['to-do', 'in_progress', 'completed', 'cancelled'] as const)
                    .filter((value) => value !== task.task_status)
                    .map((value) => (
                      <MenuItem key={value} onSelect={() => { close(); changeStatus(value) }}>
                        {taskStatusLabels[value].label}
                      </MenuItem>
                    ))
                }
              </Popover>
              <Button
                variant="secondary"
                icon={Pencil}
                onClick={() => {
                  setDraft({ title: task.task_title, description: task.description, deadline: task.deadline, priority: task.task_priority })
                  setDraftErrors({})
                  setEditingTask(true)
                }}
              >
                {t('act.edit')}
              </Button>
              <Button variant="ghost" icon={Trash2} onClick={() => setRemoving(true)}>
                {t('ts.detail.delete')}
              </Button>
            </>
          )}
        </div>
      </header>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label={t('ts.col.deadline')}>
          <p className={cn('tabular text-xl font-semibold', isOverdue(task) ? 'text-danger' : 'text-ink-900')}>{formatDate(task.deadline)}</p>
        </Fact>
        <Fact label={t('ts.detail.overall')}>
          <p className="tabular text-xl font-semibold text-ink-900">{overall}%</p>
          <Progress className="mt-2" value={overall} label={t('ts.detail.overall')} tone={overall === 100 ? 'success' : 'brand'} />
        </Fact>
        <Fact label={t('ts.card.assignees')}>
          <div className="flex items-center gap-3">
            <PersonStack userIds={list.map((item) => item.user_id)} />
            <span className="tabular text-base text-ink-700">{list.length}</span>
          </div>
        </Fact>
        <Fact label={t('ts.detail.createdBy')}>
          <PersonCell userId={task.assigned_by} size="md" subtitle={creator?.position ?? null} />
        </Fact>
      </div>
      <DetailGrid
        main={
          <>
            <Panel title={t('ts.detail.info')}>
              <DescriptionList
                columns={2}
                items={[
                  { label: t('ts.detail.created'), value: formatDateTime(task.created_at) },
                  { label: t('ts.detail.description'), value: task.description || '—', wide: true },
                  ...(required.length
                    ? [
                        {
                          label: t('ts.detail.requirements'),
                          wide: true,
                          value: (
                            <span className="flex flex-wrap gap-1.5">
                              {required.map(([skillId, level]) => (
                                <span key={skillId} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-medium text-brand-800">
                                  {getSkill(skillId)?.skill_name} · {t('ts.form.level', { n: level })}
                                </span>
                              ))}
                            </span>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </Panel>
            <Panel title={t('ts.detail.assigneesProgress')} flush>
              <ul className="divide-y divide-ink-100">
                {list.map((item) => (
                  <li key={item.user_id} className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4', item.user_id === userId && 'bg-brand-50/60')}>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <PersonCell userId={item.user_id} size="md" />
                      {item.user_id === userId && <Badge tone="brand">{t('ts.you')}</Badge>}
                    </div>
                    <Progress value={item.completion_percentage} showValue label={userName(item.user_id)} className="w-full sm:w-44" tone={item.completion_percentage === 100 ? 'success' : 'brand'} />
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        }
        side={
          <>
            {mine && (
              <Panel title={t('ts.mine.heading')}>
                <p className="tabular text-4xl font-semibold tracking-tight text-ink-900">{shown}%</p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={shown}
                  aria-label={t('ts.mine.heading')}
                  onChange={(event) => setValue(Number(event.target.value))}
                  className="mt-4 w-full accent-brand-600"
                />
                <Button
                  className="mt-4 w-full"
                  disabled={shown === mine.completion_percentage}
                  onClick={() => {
                    updateProgress(task.task_id, userId, shown)
                    toast.success(t('ts.detail.progressSaved'))
                    setValue(null)
                  }}
                >
                  {t('act.save')}
                </Button>
              </Panel>
            )}
            <Panel title={t('ts.log.title')}>
              <RichTimeline steps={steps} />
            </Panel>
          </>
        }
      />
      <ConfirmDialog
        open={pendingStatus !== null}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) applyStatus(pendingStatus)
          setPendingStatus(null)
        }}
        title={pendingStatus === 'completed' ? t('ts.confirm.completeTitle') : pendingStatus === 'cancelled' ? t('ts.confirm.cancelTitle') : t('ts.confirm.reopenTitle')}
        description={pendingStatus === 'completed' ? t('ts.confirm.completeDesc') : pendingStatus === 'cancelled' ? t('ts.confirm.cancelDesc') : t('ts.confirm.reopenDesc')}
        confirmLabel={t('act.confirm')}
      />
      <Modal
        open={editingTask}
        onClose={() => setEditingTask(false)}
        title={t('ts.edit.title')}
        description={t('ts.edit.desc')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingTask(false)}>{t('act.cancel')}</Button>
            <Button
              onClick={() => {
                const found: Record<string, string> = {}
                if (!draft.title.trim() || draft.title.trim().length > 150) found.title = t('ts.edit.errTitle')
                if (!draft.description.trim()) found.description = t('k.required')
                if (!draft.deadline) found.deadline = t('ts.form.errDeadline')
                setDraftErrors(found)
                if (Object.keys(found).length) return
                updateTask(task.task_id, { ...draft, title: draft.title.trim(), description: draft.description.trim() }, userId)
                toast.success(t('ts.edit.saved'))
                setEditingTask(false)
              }}
            >
              {t('act.save')}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label={t('ts.form.name')} error={draftErrors.title}><Input value={draft.title} onChange={(event) => setDraft((old) => ({ ...old, title: event.target.value }))} /></Field>
          <Field label={t('ts.form.description')} error={draftErrors.description}><Textarea rows={3} value={draft.description} onChange={(event) => setDraft((old) => ({ ...old, description: event.target.value }))} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('ts.form.deadline')} error={draftErrors.deadline}><Input type="date" value={draft.deadline} onChange={(event) => setDraft((old) => ({ ...old, deadline: event.target.value }))} /></Field>
            <Field label={t('ts.form.priority')}>
              <Select value={draft.priority} onChange={(event) => setDraft((old) => ({ ...old, priority: event.target.value as TaskPriority }))} options={(['low', 'medium', 'high'] as const).map((entry) => ({ value: entry, label: taskPriorityLabels[entry].label }))} />
            </Field>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={removing}
        onClose={() => setRemoving(false)}
        onConfirm={() => {
          removeTask(task.task_id, userId)
          toast.success(t('ts.detail.deleted'))
          navigate(role === 'hr_admin' ? '/tasks' : '/tasks/team')
        }}
        title={t('ts.detail.deleteTitle')}
        description={t('ts.detail.deleteDesc')}
        confirmLabel={t('act.delete')}
        tone="danger"
      />
    </div>
  )
}
