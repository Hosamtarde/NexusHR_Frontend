import type { ReactNode } from 'react'
import { ListChecks } from 'lucide-react'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { taskPriorityLabels, taskStatusLabels } from '@/lib/labels'
import type { LoadStatus } from '@/lib/sample'
import type { AssignedTask, Task } from '@/types/entities'
import { PersonStack } from '@/components/shared/Person'
import { Badge, DataTable, EmptyState, Progress, StatusBadge, type Column } from '@/components/ui'
import { assigneesOf, isOverdue, progressOf } from './data'

interface TaskListProps {
  rows: Task[]
  assignments: AssignedTask[]
  status: LoadStatus
  onRetry: () => void
  empty?: ReactNode
}

export function AssigneeStack({ taskId, assignments }: { taskId: number; assignments: AssignedTask[] }) {
  return <PersonStack userIds={assigneesOf(taskId, assignments).map((item) => item.user_id)} showName />
}

export function TaskList({ rows, assignments, status, onRetry, empty }: TaskListProps) {
  const { t } = useI18n()

  const columns: Column<Task>[] = [
    {
      key: 'task',
      header: t('ts.col.task'),
      mobile: 'primary',
      cell: (row) => (
        <span className="block max-w-[15rem]">
          <span className="block truncate font-medium text-ink-900">{row.task_title}</span>
          <span className="block truncate text-xs text-ink-500">#{row.task_id}</span>
        </span>
      ),
    },
    { key: 'assignees', header: t('ts.col.assignees'), cell: (row) => <AssigneeStack taskId={row.task_id} assignments={assignments} /> },
    {
      key: 'deadline',
      header: t('ts.col.deadline'),
      cell: (row) => (
        <span className={cn('tabular flex items-center gap-2 whitespace-nowrap', isOverdue(row) ? 'font-medium text-danger' : 'text-ink-700')}>
          {formatDate(row.deadline)}
          {isOverdue(row) && <Badge tone="danger">{t('ts.overdue')}</Badge>}
        </span>
      ),
    },
    { key: 'priority', header: t('ts.col.priority'), cell: (row) => <StatusBadge value={taskPriorityLabels[row.task_priority]} /> },
    { key: 'status', header: t('ts.col.status'), mobile: 'aside', cell: (row) => <StatusBadge value={taskStatusLabels[row.task_status]} /> },
    { key: 'progress', header: t('ts.col.progress'), cell: (row) => (row.task_status === 'cancelled' ? <span className="tabular text-sm text-ink-500">{t('ts.cancelledAt', { n: progressOf(row.task_id, assignments) })}</span> : <Progress value={progressOf(row.task_id, assignments)} showValue label={row.task_title} className="w-28" />) },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.task_id}
      rowHref={(row) => `/tasks/${row.task_id}`}
      rowLabel={(row) => row.task_title}
      status={status}
      onRetry={onRetry}
      caption={t('ts.col.task')}
      empty={empty ?? <EmptyState icon={ListChecks} title={t('ts.empty.title')} />}
    />
  )
}
