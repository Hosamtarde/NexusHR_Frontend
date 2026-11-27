import { useEffect, useState, useSyncExternalStore } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { useMediaQuery, useSidebarCollapsed } from '@/app/shell-state'
import { ButtonLink, Drawer } from '@/components/ui'
import { hasTemporaryPassword } from '@/features/auth/credentials'
import { useViewer } from '@/app/viewer-context'
import { CommandPalette } from './CommandPalette'
import { Logo } from './Logo'
import { LanguageSwitch } from './TopbarParts'
import { PrototypeSwitcher } from './PrototypeSwitcher'
import { AccountMenu } from './AccountMenu'
import { Sidebar, SidebarNav, sidebarSurface } from './Sidebar'
import { Topbar } from './Topbar'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine)
}

export function AppShell() {
  const { t, lang } = useI18n()
  const { userId } = useViewer()
  const { pathname } = useLocation()
  const online = useOnline()
  const collapsed = useSidebarCollapsed()
  const wide = useMediaQuery('(min-width: 1024px)')
  const [navOpen, setNavOpen] = useState(false)
  const fullBleed = pathname.startsWith('/messages')

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className={cn('flex bg-canvas', fullBleed ? 'h-dvh overflow-hidden' : 'min-h-dvh')}>
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-brand-600 px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:start-3"
      >
        {t('app.skip')}
      </a>
      <Sidebar rail={!wide || collapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        {!online && (
          <div role="alert" className="border-b border-warning-border bg-warning-bg px-4 py-2 text-center text-sm text-warning">
            {t('app.offline')}
          </div>
        )}
        {hasTemporaryPassword(userId) && pathname !== '/account/password' && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-b border-info-border bg-info-bg px-4 py-2 text-sm text-info">
            {t('ac.pw.tempBanner')}
            <ButtonLink to="/account/password" size="sm" variant="secondary">{t('ac.pw.tempAction')}</ButtonLink>
          </div>
        )}
        <main id="main" className={fullBleed ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-8 min-[1920px]:max-w-[1600px] lg:py-10'}>
          <Outlet key={lang} />
        </main>
      </div>
      <Drawer open={navOpen} onClose={() => setNavOpen(false)} title={t('app.name')} side="start" width="sm" hideHeader panelClassName={sidebarSurface}>
        <div className="flex h-full flex-col">
          <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/10 px-5">
            <Logo tone="light" />
          </div>
          <div className="scrollbar-light flex-1 overflow-y-auto px-3 py-4">
            <SidebarNav onNavigate={() => setNavOpen(false)} />
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <LanguageSwitch />
              <PrototypeSwitcher />
            </div>
            <ButtonLink to={`/messages/nexa-${userId}`} variant="secondary" icon={Sparkles} onClick={() => setNavOpen(false)}>
              {t('top.assistant')}
            </ButtonLink>
            <AccountMenu variant="sidebar" />
          </div>
        </div>
      </Drawer>
      <CommandPalette />
    </div>
  )
}
