import { CloudOff, Compass, ShieldAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useRouteError } from 'react-router'
import { useI18n, type TKey } from '@/i18n'
import { useAuth } from './auth/context'

interface ErrorLayoutProps {
  code: string
  icon: LucideIcon
  title: TKey
  description: TKey
  standalone?: boolean
  actions?: ReactNode
}

const buttonClass = 'inline-flex items-center justify-center rounded-control px-4 py-2 text-sm font-medium transition-colors'

export function LanguageToggle() {
  const { t, lang, setLang } = useI18n()
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className="rounded-control px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
    >
      {t('lang.switch')}
    </button>
  )
}

function ErrorLayout({ code, icon: Icon, title, description, standalone, actions }: ErrorLayoutProps) {
  const { t } = useI18n()
  const body = (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-7" strokeWidth={1.5} />
      </span>
      <p className="tabular mt-6 text-sm font-semibold text-brand-700" dir="ltr">
        {code}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-ink-900">{t(title)}</h1>
      <p className="mt-2 text-md text-ink-600">{t(description)}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {actions ?? (
          <Link to="/" className={`${buttonClass} border border-ink-200 bg-ink-0 text-ink-800 hover:bg-ink-50`}>
            {t('err.home')}
          </Link>
        )}
      </div>
    </div>
  )
  if (!standalone) return body
  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-4">
      <div className="flex items-center justify-between py-5">
        <span className="text-lg font-semibold text-brand-700">{t('app.name')}</span>
        <LanguageToggle />
      </div>
      <div className="flex flex-1 items-center justify-center">{body}</div>
    </div>
  )
}

export function ForbiddenPage({ standalone }: { standalone?: boolean }) {
  const { t } = useI18n()
  const { status, role, logout } = useAuth()
  const noRole = status === 'authenticated' && role === null
  const actions = noRole ? (
    <button type="button" onClick={() => void logout()} className={`${buttonClass} bg-brand-600 text-white hover:bg-brand-700`}>
      {t('auth.signOut')}
    </button>
  ) : undefined
  return (
    <ErrorLayout
      code="403"
      icon={ShieldAlert}
      title="err.403.title"
      description={noRole ? 'err.403.noRole' : 'err.403.desc'}
      standalone={standalone || noRole}
      actions={actions}
    />
  )
}

export function NotFoundPage({ standalone }: { standalone?: boolean }) {
  return <ErrorLayout code="404" icon={Compass} title="err.404.title" description="err.404.desc" standalone={standalone} />
}

export function ServerErrorPage({ standalone, onRetry }: { standalone?: boolean; onRetry?: () => void }) {
  const { t } = useI18n()
  const actions = onRetry ? (
    <button type="button" onClick={onRetry} className={`${buttonClass} bg-brand-600 text-white hover:bg-brand-700`}>
      {t('act.retry')}
    </button>
  ) : undefined
  return <ErrorLayout code="500" icon={CloudOff} title="err.500.title" description="err.500.desc" standalone={standalone} actions={actions} />
}

export function RouteErrorPage() {
  const error = useRouteError()
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 0
  if (status === 404) return <NotFoundPage standalone />
  if (status === 403) return <ForbiddenPage standalone />
  return <ServerErrorPage standalone />
}
