import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { useI18n } from '@/i18n'
import { formatDate } from '@/lib/format'
import { requestStatusLabels } from '@/lib/labels'
import type { LoadStatus } from '@/lib/sample'
import type { HrRequest } from '@/types/entities'
import { Button, DataTable, EmptyState, StatusBadge, type Column } from '@/components/ui'
import { PersonCell } from '@/components/shared/Person'
import { requestSummary, requestTitle } from './format'

interface RequestListProps {
  rows: HrRequest[]
  status: LoadStatus
  onRetry: () => void
  showPerson?: boolean
  empty?: ReactNode
  onDecide?: (id: number, decision: 'approved' | 'rejected') => void
}

export function RequestList({ rows, status, onRetry, showPerson, empty, onDecide }: RequestListProps) {
  const { t } = useI18n()

  const columns: Column<HrRequest>[] = [
    ...(showPerson
      ? [{ key: 'employee', header: t('rq.col.employee'), mobile: 'primary' as const, cell: (row: HrRequest) => <PersonCell userId={row.user_id} /> }]
      : []),
    {
      key: 'request',
      header: t('rq.col.request'),
      mobile: showPerson ? 'meta' : 'primary',
      cell: (row) => (
        <span className="block">
          <span className="block font-medium text-ink-900">{requestTitle(row)}</span>
          <span className="block text-xs text-ink-500">#{row.request_id}</span>
        </span>
      ),
    },
    { key: 'details', header: t('rq.col.details'), cell: (row) => <span className="line-clamp-2 max-w-xs text-ink-700">{requestSummary(row)}</span> },
    { key: 'submitted', header: t('rq.col.submitted'), cell: (row) => <span className="tabular text-ink-600">{formatDate(row.created_at)}</span> },
    { key: 'status', header: t('rq.col.status'), mobile: 'aside', cell: (row) => <StatusBadge value={requestStatusLabels[row.request_status]} /> },
    ...(onDecide
      ? [
          {
            key: 'actions',
            header: t('rq.col.actions'),
            mobile: 'hidden' as const,
            align: 'end' as const,
            cell: (row: HrRequest) => (
              <span className="flex items-center justify-end gap-1.5">
                <Button size="sm" variant="dangerOutline" onClick={() => onDecide(row.request_id, 'rejected')}>
                  {t('act.reject')}
                </Button>
                <Button size="sm" onClick={() => onDecide(row.request_id, 'approved')}>
                  {t('act.approve')}
                </Button>
              </span>
            ),
          },
        ]
      : []),
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.request_id}
      rowHref={(row) => `/requests/${row.request_id}`}
      rowLabel={(row) => requestTitle(row)}
      status={status}
      onRetry={onRetry}
      caption={t('rq.col.request')}
      empty={empty ?? <EmptyState icon={Inbox} title={t('rq.empty.title')} />}
    />
  )
}
