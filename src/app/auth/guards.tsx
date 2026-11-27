import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useI18n } from '@/i18n'
import { isAppRole, type Role } from '@/types/auth'
import { ForbiddenPage, ServerErrorPage } from '../ErrorPages'
import { useAuth } from './context'

export interface FromState {
  from?: string
}

export function SessionLoading() {
  const { t } = useI18n()
  return (
    <div role="status" aria-live="polite" className="grid min-h-dvh place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-3 text-ink-500">
        <span className="size-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <span className="text-sm">{t('auth.loadingSession')}</span>
      </div>
    </div>
  )
}

export function RequireAuth({ children }: { children?: ReactNode }) {
  const { status, retry } = useAuth()
  const location = useLocation()
  if (status === 'anonymous') {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from } satisfies FromState} />
  }
  if (status === 'loading') return <SessionLoading />
  if (status === 'error') return <ServerErrorPage standalone onRetry={retry} />
  return children ?? <Outlet />
}

export function RoleGuard({ roles, children }: { roles?: readonly Role[]; children?: ReactNode }) {
  const { user, can } = useAuth()
  const { pathname } = useLocation()
  const role = user?.role
  const allowed = isAppRole(role) && (roles ? roles.includes(role) : can(pathname))
  if (!allowed) return <ForbiddenPage />
  return children ?? <Outlet />
}

export function RedirectIfAuthenticated({ children }: { children?: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <SessionLoading />
  if (status === 'authenticated') {
    const from = (location.state as FromState | null)?.from
    return <Navigate to={from && from !== '/login' ? from : '/'} replace />
  }
  return children ?? <Outlet />
}
