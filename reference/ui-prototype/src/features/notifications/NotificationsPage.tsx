import { useState } from 'react'
import { Link } from 'react-router'
import { Bell, CheckCheck, ExternalLink, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/format'
import { useSample } from '@/lib/sample'
import { useI18n } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { Button, EmptyState, ErrorState, IconButton, PageHeader, Panel, SkeletonRows, Tabs } from '@/components/ui'
import { markAllRead, markRead, removeNotification, removeRead } from '@/store'
import { useMyNotifications } from './hooks'
import { renderNotification } from './render'

type Filter = 'all' | 'unread'

export function NotificationsPage() {
  const { t } = useI18n()
  const { userId } = useViewer()
  const { items, unread } = useMyNotifications()
  const [filter, setFilter] = useState<Filter>('all')
  const { status, data, retry } = useSample(() => items, [])
  const shown = filter === 'unread' ? data.filter((item) => !item.is_read) : data
  const read = data.length - data.filter((item) => !item.is_read).length

  return (
    <div>
      <PageHeader
        title={t('notifs.title')}
       
        actions={
          <>
            {read > 0 && (
              <Button variant="ghost" icon={Trash2} onClick={() => removeRead(userId)}>
                {t('notifs.clearRead')}
              </Button>
            )}
            <Button variant="secondary" icon={CheckCheck} disabled={unread === 0} onClick={() => markAllRead(userId)}>
              {t('notifs.markAll')}
            </Button>
          </>
        }
      />
      <Panel flush>
        <div className="border-b border-ink-100 px-5">
          <Tabs
            label={t('notifs.title')}
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'all', label: t('notifs.all'), count: data.length },
              { value: 'unread', label: t('notifs.unread'), count: data.filter((item) => !item.is_read).length },
            ]}
          />
        </div>
        {status === 'loading' ? (
          <SkeletonRows rows={5} />
        ) : status === 'error' ? (
          <ErrorState onRetry={retry} />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' && data.length > 0 ? t('notifs.emptyUnreadTitle') : t('notifs.emptyTitle')}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {shown.map((item) => {
              const text = renderNotification(item)
              return (
                <li key={item.notification_id} className="flex items-start gap-3 px-5 py-4">
                  <span className={cn('mt-2.5 size-2 shrink-0 rounded-full', item.is_read ? 'bg-transparent' : 'bg-brand-600')} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-base text-ink-900', !item.is_read && 'font-semibold')}>{text.title}</p>
                    <p className="mt-0.5 text-sm text-ink-600">{text.message}</p>
                    <p className="mt-1 text-xs text-ink-500">{formatRelative(item.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {item.link && (
                      <Link
                        to={item.link}
                        onClick={() => markRead(item.notification_id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-control px-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                      >
                        <ExternalLink className="size-4 rtl:-scale-x-100" strokeWidth={1.75} />
                        {t('notifs.open')}
                      </Link>
                    )}
                    {!item.is_read && <IconButton icon={CheckCheck} size="sm" label={t('notifs.markRead')} onClick={() => markRead(item.notification_id)} />}
                    <IconButton icon={Trash2} size="sm" label={t('notifs.delete')} onClick={() => removeNotification(item.notification_id)} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
