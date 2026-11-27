import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { Building2, Plus, UsersRound } from 'lucide-react'
import { useI18n } from '@/i18n'
import { attendanceStatusLabels } from '@/lib/labels'
import { useViewer } from '@/app/viewer-context'
import { Badge, Button, ButtonLink, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Select, StatusBadge, useToast } from '@/components/ui'
import { ListPanel, RowActions } from '@/components/shared/ListKit'
import { useList } from '@/components/shared/useList'
import { PersonCell, PersonStack } from '@/components/shared/Person'
import { bump, useTick } from '@/store/collections'
import { useStore } from '@/store'
import { todayRecord } from '@/features/attendance/data'
import { deleteDepartment, departmentMembers, departments, directReports, saveDepartment, users } from './data'
import type { Department } from '@/types/entities'

function DepartmentModal({ department, open, onClose }: { department: Department | null; open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [name, setName] = useState(department?.department_name ?? '')
  const [manager, setManager] = useState(String(department?.manager_id ?? ''))
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return setError(t('k.required'))
    if (name.trim().length > 100) return setError(t('em.form.tooLong', { n: 100 }))
    saveDepartment(name.trim(), manager ? Number(manager) : null, department?.department_id)
    bump('people')
    toast.success(department ? t('em.dept.saved') : t('em.dept.created', { name: name.trim() }))
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={department ? t('em.dept.edit') : t('em.dept.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('k.cancel')}</Button>
          <Button type="submit" form="dept-form">{t('act.save')}</Button>
        </>
      }
    >
      <form id="dept-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label={t('em.dept.name')} required error={error}><Input value={name} onChange={(e) => { setName(e.target.value); setError('') }} /></Field>
        <Field label={t('k.manager')}><Select value={manager} onChange={(e) => setManager(e.target.value)} options={[{ value: '', label: t('em.form.noManager') }, ...users.filter((u) => u.status && u.role !== 'employee').map((u) => ({ value: u.user_id, label: `${u.first_name} ${u.last_name}` }))]} /></Field>
      </form>
    </Modal>
  )
}

export function DepartmentsPage() {
  const { t } = useI18n()
  const { role } = useViewer()
  const tick = useTick('people')
  const [editing, setEditing] = useState<Department | null>(null)
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState<Department | null>(null)
  const toast = useToast()
  void tick
  const rows = departments.map((department) => ({ department, count: departmentMembers(department.department_id).filter((m) => m.user.status).length }))
  const list = useList({
    rows,
    search: (row) => row.department.department_name,
    sorters: { name: (a, b) => a.department.department_name.localeCompare(b.department.department_name), count: (a, b) => a.count - b.count },
    initialSort: { key: 'name', dir: 'asc' },
  })
  const openModal = (department: Department | null) => {
    setEditing(department)
    setOpen(true)
  }
  return (
    <div>
      <PageHeader title={t('em.dept.title')} actions={role === 'hr_admin' && <Button icon={Plus} onClick={() => openModal(null)}>{t('em.dept.add')}</Button>} />
      <ListPanel
        noun="department"
        list={list}
        searchPlaceholder={t('em.dept.search')}
        caption={t('em.dept.title')}
        rowKey={(row) => row.department.department_id}
        rowHref={(row) => `/employees/departments/${row.department.department_id}`}
        rowLabel={(row) => row.department.department_name}
        empty={<EmptyState icon={Building2} title={t('em.dept.empty')} />}
        columns={[
          { key: 'name', header: t('em.dept.name'), mobile: 'primary', sortable: true, cell: (row) => <span className="font-medium text-ink-900">{row.department.department_name}</span> },
          { key: 'manager', header: t('k.manager'), cell: (row) => (row.department.manager_id ? <PersonCell userId={row.department.manager_id} /> : '—') },
          { key: 'count', header: t('em.dept.members'), mobile: 'aside', sortable: true, cell: (row) => <PersonStack userIds={departmentMembers(row.department.department_id).filter((m) => m.user.status).map((m) => m.user.user_id)} size="xs" /> },
          ...(role === 'hr_admin'
            ? [{ key: 'actions', header: <span className="sr-only">{t('k.actions')}</span>, mobile: 'hidden' as const, align: 'end' as const, cell: (row: (typeof rows)[number]) => <RowActions actions={[{ label: t('k.view'), to: `/employees/departments/${row.department.department_id}` }, { label: t('act.edit'), onSelect: () => openModal(row.department) }, { label: t('act.delete'), tone: 'danger', onSelect: () => setRemoving(row.department) }]} /> }]
            : []),
        ]}
      />
      <ConfirmDialog open={removing !== null} onClose={() => setRemoving(null)} onConfirm={() => { if (removing) deleteDepartment(removing.department_id); bump('people'); toast.success(t('em.dept.deleted')); setRemoving(null) }} title={t('em.dept.deleteTitle')} description={t('em.dept.deleteDesc')} confirmLabel={t('act.delete')} tone="danger" />
      {open && <DepartmentModal key={editing?.department_id ?? 'new'} department={editing} open onClose={() => setOpen(false)} />}
    </div>
  )
}

export function DepartmentDetailPage() {
  const { t } = useI18n()
  const id = Number(useParams().id)
  const tick = useTick('people')
  void tick
  const department = departments.find((item) => item.department_id === id)
  const members = departmentMembers(id)
  const list = useList({ rows: members, search: (row) => `${row.name} ${row.profile.position}`, sorters: { name: (a, b) => a.name.localeCompare(b.name) }, initialSort: { key: 'name', dir: 'asc' } })
  if (!department) return <EmptyState icon={Building2} title={t('k.notFound')} action={<ButtonLink to="/employees/departments" variant="secondary">{t('k.backToList')}</ButtonLink>} />
  return (
    <div>
      <PageHeader title={department.department_name} description={t('em.dept.headcount', { n: members.filter((m) => m.user.status).length })} meta={department.manager_id ? <PersonCell userId={department.manager_id} /> : undefined} actions={<ButtonLink to="/employees/departments" variant="secondary">{t('k.backToList')}</ButtonLink>} />
      <ListPanel
        noun="employee"
        list={list}
        searchPlaceholder={t('em.list.search')}
        caption={department.department_name}
        rowKey={(row) => row.user.user_id}
        rowHref={(row) => `/org-chart/${row.user.user_id}`}
        rowLabel={(row) => row.name}
        empty={<EmptyState icon={UsersRound} title={t('em.dept.noMembers')} />}
        columns={[
          { key: 'name', header: t('k.employee'), mobile: 'primary', sortable: true, cell: (row) => <PersonCell userId={row.user.user_id} /> },
          { key: 'email', header: t('k.email'), mobile: 'hidden', cell: (row) => <span dir="ltr" className="text-ink-600">{row.user.email}</span> },
          { key: 'status', header: t('k.status'), mobile: 'aside', cell: (row) => <Badge tone={row.user.status ? 'success' : 'neutral'} dot>{row.user.status ? t('k.active') : t('k.inactive')}</Badge> },
        ]}
      />
    </div>
  )
}

export function TeamPage() {
  const { t } = useI18n()
  const { userId } = useViewer()
  const assignments = useStore((state) => state.assignments)
  const tasks = useStore((state) => state.tasks)
  const requests = useStore((state) => state.requests)
  const rows = directReports(userId)
  const open = (id: number) => assignments.filter((a) => a.user_id === id && tasks.some((task) => task.task_id === a.task_id && (task.task_status === 'to-do' || task.task_status === 'in_progress'))).length
  const pending = (id: number) => requests.filter((r) => r.user_id === id && r.request_status === 'pending').length
  const list = useList({ rows, search: (row) => `${row.name} ${row.profile.position}`, sorters: { name: (a, b) => a.name.localeCompare(b.name), tasks: (a, b) => open(a.user.user_id) - open(b.user.user_id) }, initialSort: { key: 'name', dir: 'asc' } })
  return (
    <div>
      <PageHeader title={t('em.team.title')} />
      <ListPanel
        noun="employee"
        list={list}
        searchPlaceholder={t('em.team.search')}
        caption={t('em.team.title')}
        rowKey={(row) => row.user.user_id}
        rowHref={(row) => `/attendance/employee/${row.user.user_id}`}
        rowLabel={(row) => row.name}
        empty={<EmptyState icon={UsersRound} title={t('em.team.empty')} />}
        columns={[
          { key: 'name', header: t('k.employee'), mobile: 'primary', sortable: true, cell: (row) => <PersonCell userId={row.user.user_id} /> },
          { key: 'today', header: t('em.team.today'), cell: (row) => { const record = todayRecord(row.user.user_id); return record ? <StatusBadge value={attendanceStatusLabels[record.attendance_status]} /> : <Badge>{t('person.notCheckedIn')}</Badge> } },
          { key: 'tasks', header: t('em.team.openTasks'), sortable: true, cell: (row) => <span className="tabular">{open(row.user.user_id)}</span> },
          { key: 'pending', header: t('em.team.pending'), mobile: 'aside', cell: (row) => <span className="tabular">{pending(row.user.user_id)}</span> },
        ]}
      />
    </div>
  )
}
