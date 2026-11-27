import { useRouteError } from 'react-router'
import { ArrowRight, CloudOff, Compass, ShieldAlert } from 'lucide-react'
import type { ComponentType } from 'react'
import { useI18n, type TKey } from '@/i18n'
import { ButtonLink } from '@/components/ui'
import { Logo } from '@/components/layout/Logo'
import { LanguageSwitch } from '@/components/layout/TopbarParts'

interface ErrorLayoutProps {
  code: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  title: TKey
  description: TKey
  standalone?: boolean
}

function ErrorLayout({ code, icon: Icon, title, description, standalone }: ErrorLayoutProps) {
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
      <ButtonLink to="/" icon={ArrowRight} className="mt-8" variant="secondary">
        {t('err.home')}
      </ButtonLink>
    </div>
  )
  if (!standalone) return body
  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-4">
      <div className="flex items-center justify-between py-5">
        <Logo />
        <LanguageSwitch />
      </div>
      <div className="flex flex-1 items-center justify-center">{body}</div>
    </div>
  )
}

export function ForbiddenPage({ standalone }: { standalone?: boolean }) {
  return <ErrorLayout code="403" icon={ShieldAlert} title="err.403.title" description="err.403.desc" standalone={standalone} />
}

export function NotFoundPage({ standalone }: { standalone?: boolean }) {
  return <ErrorLayout code="404" icon={Compass} title="err.404.title" description="err.404.desc" standalone={standalone} />
}

export function ServerErrorPage({ standalone }: { standalone?: boolean }) {
  return <ErrorLayout code="500" icon={CloudOff} title="err.500.title" description="err.500.desc" standalone={standalone} />
}

export function RouteErrorPage() {
  const error = useRouteError()
  const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 0
  if (status === 404) return <NotFoundPage standalone />
  return <ServerErrorPage standalone />
}
