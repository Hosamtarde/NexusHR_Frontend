import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { locate, navFor, type NavItem } from '@/app/nav'
import { setSidebarCollapsed } from '@/app/shell-state'
import { useViewer } from '@/app/viewer-context'
import { usePendingApprovals, useUnreadMessages } from '@/store/selectors'
import { useChatState } from '@/features/messages/rc/connection'
import { AccountMenu } from './AccountMenu'
import { Logo } from './Logo'

export const sidebarSurface =
  'isolate bg-gradient-to-b from-side-700 via-side-800 to-side-950 text-white before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-64 before:bg-[radial-gradient(120%_80%_at_50%_-20%,rgb(255_255_255/0.28),transparent_65%)] after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:-z-10 after:h-72 after:bg-[radial-gradient(rgb(255_255_255/0.09)_1px,transparent_1.2px)] after:bg-[size:18px_18px] after:[mask-image:linear-gradient(to_bottom,black,transparent)]'

const rowBase = 'relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200'
const rowIdle = 'text-white/85 hover:bg-white/10 hover:text-white'
const rowActive = 'bg-white/[0.16] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),inset_0_1px_10px_rgb(255_255_255/0.12)]'

function useBadges() {
  const approvals = usePendingApprovals().length
  const chat = useChatState()
  const unread = useUnreadMessages()
  const messages = chat === 'unavailable' ? 0 : unread
  return { approvals, messages }
}

function Badge({ item, badges, rail }: { item: NavItem; badges: { approvals: number; messages: number }; rail?: boolean }) {
  const count = item.dot === 'approvals' ? badges.approvals : item.dot === 'messages' ? badges.messages : 0
  if (count <= 0) return null
  if (rail) return <span className="absolute end-2 top-2 size-2.5 rounded-full bg-accent ring-2 ring-side-800" aria-hidden />
  return (
    <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs leading-none font-bold text-side-950 shadow-[0_0_0_3px_rgb(245_165_36/0.25)]">
      {count}
    </span>
  )
}

function Row({ item, active, badges, onNavigate }: { item: NavItem; active: boolean; badges: { approvals: number; messages: number }; onNavigate?: () => void }) {
  const { t } = useI18n()
  const Icon = item.icon
  return (
    <NavLink to={item.to} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn(rowBase, active ? rowActive : rowIdle)}>
      {active && <span className="absolute inset-y-2.5 -start-3 w-1 rounded-e-full bg-[#a9c8ff] shadow-[0_0_12px_2px_rgb(150_190_255/0.7)]" aria-hidden />}
      <span className="grid size-6 shrink-0 place-items-center">
        <Icon className="size-[22px]" strokeWidth={1.75} />
      </span>
      <span className="flex-1 truncate text-start">{t(item.label)}</span>
      <Badge item={item} badges={badges} />
    </NavLink>
  )
}

function RailRow({ item, active, badges }: { item: NavItem; active: boolean; badges: { approvals: number; messages: number } }) {
  const { t, isRtl } = useI18n()
  const ref = useRef<HTMLAnchorElement>(null)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const Icon = item.icon

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = () => {
    window.clearTimeout(timer.current)
    if (ref.current) setAnchor(ref.current.getBoundingClientRect())
  }
  const hide = () => {
    timer.current = window.setTimeout(() => setAnchor(null), 80)
  }
  const style = anchor ? (isRtl ? { top: anchor.top + anchor.height / 2, right: window.innerWidth - anchor.left + 10 } : { top: anchor.top + anchor.height / 2, left: anchor.right + 10 }) : undefined

  return (
    <>
      <NavLink
        ref={ref}
        to={item.to}
        aria-label={t(item.label)}
        aria-current={active ? 'page' : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={cn('relative mx-auto grid size-11 place-items-center rounded-xl transition-colors duration-200', active ? rowActive : rowIdle)}
      >
        {active && <span className="absolute inset-y-2.5 -start-3 w-1 rounded-e-full bg-[#a9c8ff] shadow-[0_0_12px_2px_rgb(150_190_255/0.7)]" aria-hidden />}
        <Icon className="size-[22px]" strokeWidth={1.75} />
        <Badge item={item} badges={badges} rail />
      </NavLink>
      {anchor && style && (
        <div role="tooltip" style={style} className="pointer-events-none fixed z-50 -translate-y-1/2 animate-fade-in rounded-lg bg-ink-900 px-3 py-1.5 text-sm font-medium text-white shadow-lg">
          {t(item.label)}
        </div>
      )}
    </>
  )
}

export function SidebarNav({ rail, onNavigate }: { rail?: boolean; onNavigate?: () => void }) {
  const { t } = useI18n()
  const { role } = useViewer()
  const { pathname } = useLocation()
  const badges = useBadges()
  const activeId = locate(role, pathname)?.item.id
  const { groups } = navFor(role)

  return (
    <nav aria-label={t('nav.main')} className="flex flex-col gap-3">
      {groups.map((group, index) => (
        <div key={group.label ?? `g${index}`} className="flex flex-col gap-0.5">
          {group.label &&
            (rail ? <div className="mx-auto mb-1 h-px w-6 bg-white/15" aria-hidden /> : <p className="px-3 pt-1 pb-0.5 text-xs font-semibold tracking-wider text-white/55 uppercase">{t(group.label)}</p>)}
          {group.items.map((item) =>
            rail ? <RailRow key={item.id} item={item} active={activeId === item.id} badges={badges} /> : <Row key={item.id} item={item} active={activeId === item.id} badges={badges} onNavigate={onNavigate} />,
          )}
        </div>
      ))}
    </nav>
  )
}

export function Sidebar({ rail }: { rail: boolean }) {
  const { t } = useI18n()
  const Toggle = rail ? PanelLeftOpen : PanelLeftClose

  return (
    <aside
      className={cn(
        sidebarSurface,
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-white/10 shadow-[4px_0_24px_-12px_rgb(10_36_97/0.5)] transition-[width] duration-300 ease-out md:flex',
        rail ? 'w-[72px]' : 'w-[264px]',
      )}
    >
      <div className={cn('flex h-[60px] shrink-0 items-center border-b border-white/10', rail ? 'justify-center' : 'justify-between px-5')}>
        <Logo compact={rail} tone="light" />
        {!rail && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            aria-label={t('nav.collapse')}
            title={t('nav.collapse')}
            className="hidden size-9 place-items-center rounded-lg text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white lg:grid"
          >
            <Toggle className="size-5 rtl:-scale-x-100" strokeWidth={1.75} />
          </button>
        )}
      </div>
      <div className="scrollbar-light flex-1 overflow-y-auto px-3 py-3">
        <SidebarNav rail={rail} />
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 border-t border-white/10 p-3">
        {rail && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            aria-label={t('nav.expand')}
            title={t('nav.expand')}
            className={cn(rowBase, rowIdle, 'mx-auto hidden size-11 justify-center px-0 lg:flex')}
          >
            <Toggle className="size-[22px] rtl:-scale-x-100" strokeWidth={1.75} />
          </button>
        )}
        <AccountMenu variant={rail ? 'rail' : 'sidebar'} />
      </div>
    </aside>
  )
}
