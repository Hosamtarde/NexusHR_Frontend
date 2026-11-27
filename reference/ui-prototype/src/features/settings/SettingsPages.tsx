import { Activity, Users } from 'lucide-react'
import { useI18n, type TKey } from '@/i18n'
import { formatDateTime } from '@/lib/format'
import { activityActionLabels, roleLabels } from '@/lib/labels'
import { useViewer } from '@/app/viewer-context'
import { Badge, EmptyState, PageHeader, Select, StatusBadge, useToast } from '@/components/ui'
import { ListPanel, RowActions } from '@/components/shared/ListKit'
import { useList, type FilterDef } from '@/components/shared/useList'
import { PersonCell } from '@/components/shared/Person'
import { bump, useTick } from '@/store/collections'
import { allEmployees, users, type EmployeeRow } from '@/features/employees/data'
import type { ActivityLog, Role } from '@/types/entities'
import { logActivity, useActivity } from './data'
const roles: Role[] = ['hr_admin', 'manager', 'employee']

export function UsersPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { userId } = useViewer()
  const tick = useTick('people')
  void tick
  const rows = allEmployees()
  const filters: FilterDef<EmployeeRow>[] = [
    { key: 'role', label: t('k.role'), allLabel: t('k.allRoles'), options: roles.map((r) => ({ value: r, label: roleLabels[r].label })), test: (row, v) => row.user.role === v },
    { key: 'status', label: t('k.status'), allLabel: t('k.allStatuses'), options: [{ value: 'on', label: t('k.active') }, { value: 'off', label: t('k.inactive') }], test: (row, v) => row.user.status === (v === 'on') },
  ]
  const list = useList({ rows, filters, search: (row) => `${row.name} ${row.user.email}`, sorters: { name: (a, b) => a.name.localeCompare(b.name), role: (a, b) => a.user.role.localeCompare(b.user.role) }, initialSort: { key: 'name', dir: 'asc' } })
  const setRole = (row: EmployeeRow, role: Role) => {
    if (row.user.role === 'hr_admin' && users.filter((u) => u.role === 'hr_admin' && u.status).length <= 1) return toast.error(t('st.users.lastAdmin'))
    row.user.role = role
    bump('people')
    logActivity(userId, 'update', 'users', row.user.user_id, 'PATCH', `/users/${row.user.user_id}/role`)
    toast.success(t('st.users.roleSaved', { name: row.name, role: roleLabels[role].label }))
  }
  return (
    <div>
      <PageHeader title={t('st.users.title')} />
      <ListPanel
        noun="user"
        list={list}
        searchPlaceholder={t('st.users.search')}
        caption={t('st.users.title')}
        rowKey={(row) => row.user.user_id}
        empty={<EmptyState icon={Users} title={t('k.noResults')} />}
        columns={[
          { key: 'name', header: t('k.employee'), mobile: 'primary', sortable: true, cell: (row) => <PersonCell userId={row.user.user_id} subtitle={row.user.email} /> },
          { key: 'role', header: t('k.role'), sortable: true, cell: (row) => <Select aria-label={t('k.role')} value={row.user.role} onChange={(e) => setRole(row, e.target.value as Role)} options={roles.map((r) => ({ value: r, label: roleLabels[r].label }))} className="w-40" /> },
          { key: 'status', header: t('k.status'), mobile: 'aside', cell: (row) => <Badge tone={row.user.status ? 'success' : 'neutral'} dot>{row.user.status ? t('k.active') : t('k.inactive')}</Badge> },
          { key: 'actions', header: <span className="sr-only">{t('k.actions')}</span>, mobile: 'hidden', align: 'end', cell: (row) => <RowActions actions={[{ label: t('k.view'), to: `/employees/${row.user.user_id}` }]} /> },
        ]}
      />
    </div>
  )
}

export function ActivityLogPage() {
  const { t } = useI18n()
  const logs = useActivity()
  const entities = [...new Set(logs.map((log) => log.entity))]
  const nameOf = (id: number | null) => (id ? (allEmployees().find((row) => row.user.user_id === id)?.name ?? '') : t('st.log.system'))
  const filters: FilterDef<ActivityLog>[] = [
    { key: 'action', label: t('st.log.action'), allLabel: t('st.log.allActions'), options: (['create', 'update', 'delete'] as const).map((a) => ({ value: a, label: activityActionLabels[a].label })), test: (r, v) => r.action === v },
    { key: 'entity', label: t('st.log.entity'), allLabel: t('st.log.allEntities'), options: entities.map((e) => ({ value: e, label: t(`st.ent.${e}` as TKey) })), test: (r, v) => r.entity === v },
  ]
  const list = useList({ rows: logs, filters, search: (r) => `${nameOf(r.user_id)} ${r.path}`, sorters: { when: (a, b) => a.created_at.localeCompare(b.created_at), user: (a, b) => nameOf(a.user_id).localeCompare(nameOf(b.user_id)) }, initialSort: { key: 'when', dir: 'desc' } })
  return (
    <div>
      <PageHeader title={t('st.log.title')} />
      <ListPanel
        noun="log"
        list={list}
        searchPlaceholder={t('st.log.search')}
        caption={t('st.log.title')}
        rowKey={(r) => r.log_id}
        empty={<EmptyState icon={Activity} title={t('st.log.empty')} />}
        columns={[
          { key: 'user', header: t('st.log.user'), mobile: 'primary', sortable: true, cell: (r) => (r.user_id ? <PersonCell userId={r.user_id} /> : <span className="text-ink-500">{t('st.log.system')}</span>) },
          { key: 'action', header: t('st.log.action'), mobile: 'aside', cell: (r) => <StatusBadge value={activityActionLabels[r.action]} /> },
          { key: 'entity', header: t('st.log.entity'), cell: (r) => t(`st.ent.${r.entity}` as TKey) },
          { key: 'entityId', header: t('st.log.entityId'), mobile: 'hidden', cell: (r) => <span className="tabular text-ink-600">{r.entity_id ?? '—'}</span> },
          { key: 'path', header: t('st.log.path'), mobile: 'hidden', cell: (r) => <span dir="ltr" className="text-ink-600"><span className="font-medium text-ink-800">{r.method}</span> {r.path}</span> },
          { key: 'when', header: t('st.log.when'), sortable: true, cell: (r) => <span className="tabular text-ink-600">{formatDateTime(r.created_at)}</span> },
        ]}
      />
    </div>
  )
}
