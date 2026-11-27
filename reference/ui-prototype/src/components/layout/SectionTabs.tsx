import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { locate, tabsFor } from '@/app/nav'
import { useViewer } from '@/app/viewer-context'

export function SectionTabs({ className }: { className?: string }) {
  const { t } = useI18n()
  const { role } = useViewer()
  const { pathname } = useLocation()
  const located = locate(role, pathname)
  if (!located) return null
  const tabs = tabsFor(located.item, role)
  if (tabs.length < 2) return null
  if (!tabs.some((tab) => tab.to === pathname)) return null

  return (
    <nav aria-label={t(located.item.label)} className={cn('scrollbar-thin -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
      <ul className="inline-flex min-w-max gap-1 rounded-2xl border border-ink-200/80 bg-white p-1 shadow-card">
        {tabs.map((tab) => {
          const active = located.tab?.to === tab.to
          return (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                  active ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-600 hover:bg-brand-50 hover:text-brand-700',
                )}
              >
                {t(tab.label)}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
