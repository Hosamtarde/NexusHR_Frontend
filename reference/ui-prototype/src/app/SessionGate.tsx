import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useViewer } from './viewer-context'

export function SessionGate({ landing, children }: { landing: ReactNode; children: ReactNode }) {
  const { signedIn } = useViewer()
  const { pathname } = useLocation()
  if (signedIn) return children
  return pathname === '/' ? landing : <Navigate to="/" replace />
}
