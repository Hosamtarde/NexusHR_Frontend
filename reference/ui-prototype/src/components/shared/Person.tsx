import { useCallback, useEffect, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Clock, Mail, Network, UserRound, UsersRound } from 'lucide-react'
import { Avatar, Badge, ButtonLink } from '@/components/ui'
import { Floating } from '@/components/ui/floating'
import { cn } from '@/lib/cn'
import { presenceTone } from '@/lib/presence'
import { attendanceStatusLabels } from '@/lib/labels'
import { employeeCard, getProfile, getUser, teamIds } from '@/features/employees/data'
import { todayRecord, todayStatusLabel } from '@/features/attendance/data'
import { useViewer } from '@/app/viewer-context'
import { useI18n } from '@/i18n'

interface PersonCellProps {
  userId?: number
  name?: string
  src?: string | null
  subtitle?: string | null
  size?: 'xs' | 'sm' | 'md'
  card?: boolean
  to?: string
  compact?: boolean
  avatarOnly?: boolean
  presence?: 'online' | 'away' | 'busy' | 'offline'
  className?: string
}



export function PersonAvatar({ src, firstName, size = 'sm', presence, className }: { src?: string | null; firstName?: string | null; size?: 'xs' | 'sm' | 'md'; presence?: 'online' | 'away' | 'busy' | 'offline'; className?: string }) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar src={src} firstName={firstName} size={size} />
      {presence && <span className={cn('absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full ring-2 ring-white', presenceTone[presence])} aria-hidden />}
    </span>
  )
}

interface PersonHoverProps {
  userId: number
  to?: string
  label?: string
  className?: string
  children: ReactNode
}

export function PersonHover({ userId, to, label, className, children }: PersonHoverProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLAnchorElement & HTMLButtonElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const touch = useRef(false)
  const user = getUser(userId)
  const name = label ?? (user ? `${user.first_name} ${user.last_name}` : '')
  const close = useCallback(() => setOpen(false), [])
  const schedule = (next: boolean, delay: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(next), delay)
  }
  const hold = () => window.clearTimeout(timer.current)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  if (!user) return <span className={className}>{children}</span>
  const shared = {
    ref: anchor,
    className: cn('relative z-[2] rounded-control text-start', className),
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    'aria-label': t('person.card', { name }),
    onPointerDown: (event: PointerEvent) => {
      touch.current = event.pointerType !== 'mouse'
      event.stopPropagation()
    },
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === 'mouse') schedule(true, 250)
    },
    onPointerLeave: (event: PointerEvent) => {
      if (event.pointerType === 'mouse') schedule(false, 150)
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      if (event.currentTarget.matches(':focus-visible')) schedule(true, 0)
    },
    onBlur: () => schedule(false, 150),
  }
  return (
    <>
      {to ? (
        <Link
          {...shared}
          to={to}
          onClick={(event) => {
            event.stopPropagation()
            if (touch.current) {
              event.preventDefault()
              setOpen((value) => !value)
            }
          }}
        >
          {children}
        </Link>
      ) : (
        <button
          {...shared}
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            hold()
            setOpen((value) => !value)
          }}
        >
          {children}
        </button>
      )}
      <Floating open={open} anchorRef={anchor} onClose={close} align="start" minWidth={288} role="dialog" focusFirst={false} className="w-72 overflow-hidden">
        <div onPointerEnter={hold} onPointerLeave={() => schedule(false, 150)} aria-label={t('person.cardTitle')}>
          <CardBody userId={userId} />
        </div>
      </Floating>
    </>
  )
}

export function PersonCell({ userId, name: nameProp, src, subtitle, size = 'md', card = true, to, compact = false, avatarOnly = false, presence, className }: PersonCellProps) {
  const { t } = useI18n()
  const user = userId == null ? null : getUser(userId)
  const name = nameProp ?? (user ? `${user.first_name} ${user.last_name}` : t('person.deleted'))
  const sub = compact ? null : subtitle !== undefined ? subtitle : userId != null ? (getProfile(userId)?.position ?? null) : null
  const avatar = <PersonAvatar src={src ?? user?.profile_image} firstName={user?.first_name ?? name} size={size} presence={presence} />
  const interactive = card && user !== null && userId != null
  const body = avatarOnly ? (
    avatar
  ) : (
    <>
      {avatar}
      <span className="min-w-0 text-start">
        <span className={cn('block truncate font-semibold text-ink-900', size === 'md' ? 'text-[15px]' : 'text-sm', interactive && 'group-hover:text-brand-700 group-hover:underline')}>{name}</span>
        {sub && <span className="block truncate text-xs text-ink-500">{sub}</span>}
      </span>
    </>
  )
  if (!interactive) return <span className={cn('flex min-w-0 items-center gap-2.5', className)}>{body}</span>
  return (
    <PersonHover userId={userId} to={to} label={name} className={cn('group flex min-w-0 items-center gap-2.5', className)}>
      {body}
    </PersonHover>
  )
}

export function PersonStack({ userIds, size = 'sm', max = 3, showName = false, className }: { userIds: number[]; size?: 'xs' | 'sm' | 'md'; max?: number; showName?: boolean; className?: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  if (userIds.length === 0) return <span className="text-ink-400">—</span>
  if (userIds.length === 1) return <PersonCell userId={userIds[0]} size={size} className={className} />
  const shown = userIds.slice(0, max)
  const rest = userIds.slice(shown.length)
  const first = getUser(userIds[0]!)
  const firstName = first ? `${first.first_name} ${first.last_name}` : ''
  const chip = size === 'xs' ? 'size-6 text-[10px]' : size === 'md' ? 'size-10 text-sm' : 'size-8 text-xs'
  return (
    <span className={cn('relative inline-flex min-w-0 items-center gap-2', className)}>
      <span className="flex shrink-0 -space-x-2 rtl:space-x-reverse">
        {shown.map((id) => (
          <PersonHover key={id} userId={id} className="rounded-full">
            <Avatar src={getUser(id)?.profile_image} firstName={getUser(id)?.first_name} size={size} className="ring-2 ring-white" />
          </PersonHover>
        ))}
        {rest.length > 0 && (
          <button
            ref={anchor}
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={t('person.everyone', { n: userIds.length })}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setOpen((value) => !value)
            }}
            className={cn('tabular relative z-[2] inline-flex items-center justify-center rounded-full bg-ink-100 font-semibold text-ink-700 ring-2 ring-white hover:bg-ink-200', chip)}
          >
            +{rest.length}
          </button>
        )}
      </span>
      {showName && (
        <span className="min-w-0 truncate text-sm font-medium text-ink-900">
          {firstName} <span className="tabular text-ink-500">+{userIds.length - 1}</span>
        </span>
      )}
      <Floating open={open} anchorRef={anchor} onClose={close} align="start" minWidth={256} role="dialog" focusFirst={false} className="p-3">
        <div className="flex flex-col gap-2.5" aria-label={t('person.everyone', { n: userIds.length })}>
          {rest.map((id) => (
            <PersonCell key={id} userId={id} size="sm" />
          ))}
        </div>
      </Floating>
    </span>
  )
}

function CardBody({ userId }: { userId: number }) {
  const { t } = useI18n()
  const { role, userId: viewerId } = useViewer()
  const data = employeeCard(userId, todayStatusLabel(userId))
  if (!data) return <p className="p-4 text-sm text-ink-600">{t('person.noData')}</p>
  const record = todayRecord(userId)
  const tone = record ? attendanceStatusLabels[record.attendance_status].tone : 'neutral'
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 border-b border-ink-100 p-4">
        <Avatar src={data.profileImage} firstName={getUser(userId)?.first_name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink-900">{data.fullName}</p>
          <p className="truncate text-sm text-ink-600">{data.position ?? '—'}</p>
          {data.todayStatus && (
            <Badge tone={tone} dot className="mt-1.5">
              {t('person.today', { status: data.todayStatus })}
            </Badge>
          )}
        </div>
      </div>
      <dl className="divide-y divide-ink-100 px-4">
        {[
          { icon: Mail, label: t('person.email'), value: <span dir="ltr">{data.email}</span> },
          { icon: Network, label: t('person.department'), value: data.department ?? '—' },
          { icon: UserRound, label: t('person.manager'), value: data.managerName ?? t('person.none') },
          { icon: UsersRound, label: t('person.reports'), value: data.directReports },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2.5 py-2.5">
            <Icon className="size-4 shrink-0 text-ink-400" strokeWidth={1.75} />
            <dt className="w-24 shrink-0 text-xs text-ink-500">{label}</dt>
            <dd className="min-w-0 truncate text-sm text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2 border-t border-ink-100 p-3">
        {role === 'hr_admin' && (
          <ButtonLink to={`/employees/${userId}`} size="sm">
            {t('person.fullProfile')}
          </ButtonLink>
        )}
        {(role === 'hr_admin' || (role === 'manager' && teamIds(viewerId).includes(userId))) && (
          <ButtonLink to={`/attendance/employee/${userId}`} variant="secondary" size="sm" icon={Clock}>
            {t('person.attendance')}
          </ButtonLink>
        )}
        <ButtonLink to={`/org-chart/${userId}`} variant="secondary" size="sm" icon={Network}>
          {t('person.inOrg')}
        </ButtonLink>
      </div>
    </div>
  )
}
