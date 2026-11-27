import { useEffect, useState, type ComponentType } from 'react'
import { Link, useLocation } from 'react-router'
import { Bell, ChevronLeft, Menu, Search, Sparkles, UserRound } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { accountPages, locate } from '@/app/nav'
import { setPaletteOpen } from '@/app/shell-state'
import { useViewer } from '@/app/viewer-context'
import { LanguageSwitch, NotificationsMenu, TileButton } from './TopbarParts'
import { PrototypeSwitcher } from './PrototypeSwitcher'

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>

function useCrumbs() {
  const { t } = useI18n()
  const { role } = useViewer()
  const { pathname } = useLocation()
  const located = locate(role, pathname)
  if (located) {
    return {
      trail: located.tab ? [t(located.item.label)] : located.item.parent ? [t(located.item.parent)] : [],
      title: t(located.tab ? located.tab.label : located.item.label),
      icon: located.item.icon as IconType,
    }
  }
  const account = accountPages.find((leaf) => pathname === leaf.to || pathname.startsWith(`${leaf.to}/`))
  return { trail: [] as string[], title: account ? t(account.label) : '', icon: (account?.to === '/notifications' ? Bell : UserRound) as IconType }
}

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const { t } = useI18n()
  const { userId } = useViewer()
  const { trail, title, icon: Icon } = useCrumbs()
  const inMessages = useLocation().pathname.startsWith('/messages')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-3 border-b bg-white/70 px-3 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-200 sm:px-6',
        scrolled ? 'border-ink-200 shadow-[0_8px_24px_-12px_rgb(15_35_80/0.25)]' : 'border-ink-200/60',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <TileButton icon={Menu} label={t('nav.openMenu')} onClick={onOpenNav} className="md:hidden" />
        <nav aria-label={t('nav.breadcrumbs')} className="flex min-w-0 items-center gap-2.5 text-sm">
          <span className="hidden size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 sm:grid" aria-hidden>
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          {trail.map((part) => (
            <span key={part} className="hidden items-center gap-2.5 whitespace-nowrap text-ink-500 xl:flex">
              {part}
              <ChevronLeft className="size-3.5 text-ink-300 ltr:rotate-180" strokeWidth={1.75} aria-hidden />
            </span>
          ))}
          <span className="truncate whitespace-nowrap text-base font-semibold text-ink-900" aria-current="page">
            {title}
          </span>
        </nav>
      </div>

      {!inMessages && <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-label={t('top.search')}
        className="hidden h-10 w-[min(28vw,400px)] shrink-0 items-center gap-2.5 rounded-xl border border-ink-200/80 bg-white/80 px-3.5 text-sm text-ink-500 shadow-sm transition-[border-color,background-color] duration-150 hover:border-brand-200 hover:bg-white xl:flex"
      >
        <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="flex-1 truncate text-start">{t('top.searchHint')}</span>
        <kbd className="rounded-md border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-xs font-medium text-ink-500" dir="ltr">
          Ctrl K
        </kbd>
      </button>}

      <div className="flex flex-1 items-center justify-end gap-2">
        {!inMessages && <TileButton icon={Search} label={t('top.search')} onClick={() => setPaletteOpen(true)} className="xl:hidden" />}
        <Link
          to={`/messages/nexa-${userId}`}
          aria-label={t('top.assistant')}
          title={t('top.assistant')}
          className="relative hidden size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 text-white shadow-[0_6px_14px_-6px_rgb(40_86_189/0.8),inset_0_1px_0_rgb(255_255_255/0.3)] transition-transform duration-150 hover:scale-105 active:scale-95 md:grid"
        >
          <Sparkles className="size-5" strokeWidth={1.75} aria-hidden />
        </Link>
        <NotificationsMenu />
        <LanguageSwitch className="hidden md:flex" />
        <PrototypeSwitcher className="hidden md:flex" />
      </div>
    </header>
  )
}
