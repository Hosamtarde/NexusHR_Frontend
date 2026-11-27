import { createContext, useContext } from 'react'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastApi {
  success: (title: string, description?: string, action?: ToastAction) => void
  error: (title: string, description?: string, action?: ToastAction) => void
  info: (title: string, description?: string, action?: ToastAction) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
