import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useI18n } from '@/i18n'
import { Logo } from '@/components/layout/Logo'
import { LanguageSwitch } from '@/components/layout/TopbarParts'
import { Network } from './Network'

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-brand-50">
      <Network tone="light" />
      <header className="relative flex items-center justify-between gap-3 px-5 py-4 sm:px-10 sm:py-6" dir="ltr">
        <Logo to="/" />
        <LanguageSwitch />
      </header>
      <main id="main" className="relative flex flex-1 items-center justify-center px-5 py-6 sm:px-10">
        <div className="w-full max-w-[28rem]">
          <div className="rounded-dialog border border-ink-200 bg-white p-6 shadow-md sm:p-8">{children}</div>
          <p className="mt-5 text-center text-sm">
            <Link to="/careers" className="font-medium text-brand-700 hover:underline">
              {t('auth.careersLink')}
            </Link>
          </p>
        </div>
      </main>
      <p className="relative px-5 pb-5 text-center text-sm text-ink-600">{t('au.footer.copy', { year: 2026 })}</p>
    </div>
  )
}
