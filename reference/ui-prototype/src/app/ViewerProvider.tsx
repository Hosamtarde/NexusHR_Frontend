import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Role } from '@/types/entities'
import { employeeRow, viewerIds } from '@/features/employees/data'
import { useI18n } from '@/i18n'
import { ViewerContext, type TodayAttendance, type ViewerState } from './viewer-context'

const storageKey = 'nexushr.preview-role'
const sessionKey = 'nexushr.signed-in'

function isRole(value: string | null): value is Role {
  return value === 'hr_admin' || value === 'manager' || value === 'employee'
}

function readRole(): Role {
  const fromUrl = new URLSearchParams(window.location.search).get('role')
  if (isRole(fromUrl)) return fromUrl
  try {
    const value = window.sessionStorage.getItem(storageKey)
    if (isRole(value)) return value
  } catch {
    return 'hr_admin'
  }
  return 'hr_admin'
}

function readSignedIn() {
  if (isRole(new URLSearchParams(window.location.search).get('role'))) return true
  try {
    return window.sessionStorage.getItem(sessionKey) === '1'
  } catch {
    return false
  }
}

const initialToday: Record<Role, TodayAttendance> = {
  hr_admin: { checkIn: '07:52', checkOut: null },
  manager: { checkIn: '08:05', checkOut: null },
  employee: { checkIn: null, checkOut: null },
}

function nowTime() {
  const date = new Date()
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function ViewerProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n()
  const [role, setRoleState] = useState<Role>(readRole)
  const [signedIn, setSignedIn] = useState(readSignedIn)
  const [todayByRole, setTodayByRole] = useState(initialToday)

  const setRole = useCallback((next: Role) => {
    setRoleState(next)
    try {
      window.sessionStorage.setItem(storageKey, next)
    } catch {
      return
    }
  }, [])

  const signIn = useCallback(() => {
    setSignedIn(true)
    try {
      window.sessionStorage.setItem(sessionKey, '1')
    } catch {
      return
    }
  }, [])

  const value = useMemo<ViewerState>(() => {
    void lang
    const userId = viewerIds[role]
    const row = employeeRow(userId)!
    return {
      role,
      userId,
      user: row.user,
      row,
      signedIn,
      signIn,
      setRole,
      signOut: () => {
        setSignedIn(false)
        try {
          window.sessionStorage.removeItem(storageKey)
          window.sessionStorage.removeItem(sessionKey)
        } catch {
          return
        }
      },
      today: todayByRole[role],
      checkIn: () => setTodayByRole((current) => ({ ...current, [role]: { checkIn: nowTime(), checkOut: null } })),
      checkOut: () => setTodayByRole((current) => ({ ...current, [role]: { ...current[role], checkOut: nowTime() } })),
    }
  }, [role, setRole, signedIn, signIn, todayByRole, lang])

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>
}
