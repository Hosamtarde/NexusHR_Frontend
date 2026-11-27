import { createContext, useContext } from 'react'
import type { Role, User } from '@/types/entities'
import type { EmployeeRow } from '@/features/employees/data'

export interface TodayAttendance {
  checkIn: string | null
  checkOut: string | null
}

export interface ViewerState {
  role: Role
  userId: number
  user: User
  row: EmployeeRow
  signedIn: boolean
  signIn: () => void
  setRole: (role: Role) => void
  signOut: () => void
  today: TodayAttendance
  checkIn: () => void
  checkOut: () => void
}

export const ViewerContext = createContext<ViewerState | null>(null)

export function useViewer() {
  const context = useContext(ViewerContext)
  if (!context) throw new Error('useViewer must be used inside ViewerProvider')
  return context
}
