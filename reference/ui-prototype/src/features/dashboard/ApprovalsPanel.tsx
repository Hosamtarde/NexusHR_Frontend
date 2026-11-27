import { Link } from 'react-router'
import { Inbox } from 'lucide-react'
import { useI18n } from '@/i18n'
import { Button, EmptyState, ErrorState, Panel, SkeletonRows, useToast } from '@/components/ui'
import { PersonCell } from '@/components/shared/Person'
import { useViewer } from '@/app/viewer-context'
import type { LoadStatus } from '@/lib/sample'
import { reviewRequest } from '@/store'
import { usePendingApprovals } from '@/store/selectors'
import { requestSummary, requestTitle } from '@/features/requests/format'
import { userName } from '@/features/employees/data'

interface ApprovalsPanelProps {
  status: LoadStatus
  empty: boolean
  onRetry: () => void
  limit?: number
}

export function ApprovalsPanel({ status, empty, onRetry, limit = 4 }: ApprovalsPanelProps) {
  const { t } = useI18n()
  const toast = useToast()
  const { userId } = useViewer()
  const pending = usePendingApprovals()
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const shown = empty ? [] : pending.slice(0, limit)

  const decide = (id: number, decision: 'approved' | 'rejected') => {
    const undo = reviewRequest(id, decision, userId)
    toast.success(t(decision === 'approved' ? 'dash.approvals.approved' : 'dash.approvals.rejected'), t('dash.approvals.notified'), { label: t('dash.undo'), onClick: undo })
  }

  return (
    <Panel
      title={t('dash.approvals.title')}
     
      flush
      actions={
        <Link to="/requests/approvals" className="text-sm font-medium text-brand-700 hover:underline">
          {t('act.viewAll')}
        </Link>
      }
    >
      {status === 'loading' ? (
        <SkeletonRows rows={4} />
      ) : status === 'error' ? (
        <ErrorState compact onRetry={onRetry} />
      ) : shown.length === 0 ? (
        <EmptyState compact icon={Inbox} title={t('dash.approvals.emptyTitle')} />
      ) : (
        <ul className="divide-y divide-ink-100">
          {shown.map((request) => (
            <li key={request.request_id} className="flex items-center gap-3 px-5 py-4 transition-colors duration-150 hover:bg-brand-50/50">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <PersonCell size="md" userId={request.user_id} avatarOnly />
                <Link to={`/requests/${request.request_id}`} className="min-w-0 rounded-control" aria-label={t('dash.approvals.open')}>
                  <span className="block truncate text-sm font-medium text-ink-900">{userName(request.user_id)}</span>
                  <span className="block truncate text-xs text-ink-500">{`${requestTitle(request)} · ${requestSummary(request)}`}</span>
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" variant="dangerOutline" onClick={() => decide(request.request_id, 'rejected')}>
                  {t('act.reject')}
                </Button>
                <Button size="sm" onClick={() => decide(request.request_id, 'approved')}>
                  {t('act.approve')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
