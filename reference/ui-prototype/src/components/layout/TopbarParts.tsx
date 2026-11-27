import { Link, useNavigate } from 'react-router'
import { forwardRef, type ButtonHTMLAttributes, type ComponentType } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/format'
import { useI18n, type Lang } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { markAllRead, markRead } from '@/store'
import { useMyNotifications } from '@/features/notifications/hooks'
import { renderNotification } from '@/features/notifications/render'
import { Popover } from '@/components/ui'

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>

interface TileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType
  label: string
}

export const tileClass =
  'relative grid size-10 place-items-center rounded-xl border border-ink-200/80 bg-white text-ink-600 shadow-sm transition-[color,background-color,border-color,transform] duration-150 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 active:scale-95 active:bg-brand-100'

export const TileButton = forwardRef<HTMLButtonElement, TileButtonProps>(function TileButton({ icon: Icon, label, className, children, ...rest }, ref) {
  return (
    <button ref={ref} type="button" aria-label={label} title={label} className={cn(tileClass, className)} {...rest}>
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      {children}
    </button>
  )
})

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n()
  const options: { value: Lang; label: string }[] = [
    { value: 'ar', label: 'ع' },
    { value: 'en', label: 'EN' },
  ]
  return (
    <div role="radiogroup" aria-label={t('top.language')} className={cn('flex h-10 items-center rounded-xl border border-ink-200/80 bg-white p-1 shadow-sm', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={lang === option.value}
          onClick={() => setLang(option.value)}
          className={cn(
            'h-8 min-w-9 rounded-lg px-2 text-sm font-semibold transition-colors duration-150',
            lang === option.value ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-600 hover:bg-brand-50 hover:text-brand-700',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function NotificationsMenu() {
  const { t } = useI18n()
  const { userId } = useViewer()
  const { items, unread } = useMyNotifications()
  const navigate = useNavigate()
  const latest = items.slice(0, 8)

  return (
    <Popover
      className="w-[min(92vw,400px)]"
      trigger={({ toggle, open, id }) => (
        <TileButton
          icon={Bell}
          label={unread ? t('top.notificationsUnread', { n: unread }) : t('top.notifications')}
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
        >
          {unread > 0 && (
            <span className="absolute -top-1.5 -end-1.5 grid size-[18px] place-items-center" aria-hidden>
              <span className="absolute inset-0 animate-ping-soft rounded-full bg-accent/70" />
              <span className="tabular relative grid size-[18px] place-items-center rounded-full bg-accent text-[11px] leading-none font-bold text-side-950 ring-2 ring-white">{unread}</span>
            </span>
          )}
        </TileButton>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="font-semibold text-ink-900">{t('top.notifications')}</p>
            {unread > 0 && (
              <button type="button" onClick={() => markAllRead(userId)} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
                <CheckCheck className="size-4" strokeWidth={1.75} />
                {t('top.markAllRead')}
              </button>
            )}
          </div>
          {latest.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-500">{t('top.noNotifications')}</p>
          ) : (
            <ul className="scrollbar-thin max-h-[60vh] divide-y divide-ink-100 overflow-y-auto">
              {latest.map((item) => {
                const text = renderNotification(item)
                return (
                  <li key={item.notification_id}>
                    <button
                      type="button"
                      onClick={() => {
                        markRead(item.notification_id)
                        close()
                        if (item.link) navigate(item.link)
                      }}
                      className="relative flex w-full gap-3 px-4 py-3.5 text-start transition-colors hover:bg-ink-50"
                    >
                      <span className={cn('mt-2 size-2 shrink-0 rounded-full', item.is_read ? 'bg-transparent' : 'bg-brand-600')} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm text-ink-900', !item.is_read && 'font-semibold')}>{text.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-ink-600">{text.message}</p>
                        <p className="mt-1 text-xs text-ink-500">{formatRelative(item.created_at)}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="border-t border-ink-100 p-1.5">
            <Link to="/notifications" onClick={close} className="block rounded-control py-2 text-center text-sm font-medium text-brand-700 hover:bg-brand-50">
              {t('top.viewAllNotifications')}
            </Link>
          </div>
        </div>
      )}
    </Popover>
  )
}
