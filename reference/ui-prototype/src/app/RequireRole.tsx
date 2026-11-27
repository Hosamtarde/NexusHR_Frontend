import type { ReactNode } from 'react'
import { ForbiddenPage } from '@/features/system/ErrorPages'
import { canAccess } from './access'
import { useViewer } from './viewer-context'

export function RequireRole({ path, children }: { path: string; children: ReactNode }) {
  const { role } = useViewer()
  if (!canAccess(role, path)) return <ForbiddenPage />
  return <>{children}</>
}
