import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useI18n } from '@/i18n'
import { createPortal } from 'react-dom'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ToastContext, type ToastAction, type ToastApi } from './toast-context'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
  action?: ToastAction
}

const icons = { success: CircleCheck, error: CircleAlert, info: Info }
const iconTones = { success: 'text-success', error: 'text-danger', info: 'text-info' }

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((item) => item.id !== id)), [])

  const push = useCallback(
    (tone: ToastTone, title: string, description?: string, action?: ToastAction) => {
      const id = ++counter
      setItems((list) => [...list.slice(-3), { id, tone, title, description, action }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : action ? 5000 : 4500)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description, action) => push('success', title, description, action),
      error: (title, description, action) => push('error', title, description, action),
      info: (title, description, action) => push('info', title, description, action),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] md:bottom-4 flex flex-col items-center gap-2 sm:inset-x-auto sm:start-6 sm:bottom-6 sm:items-start"
        >
          {items.map((item) => {
            const Icon = icons[item.tone]
            return (
              <div
                key={item.id}
                role={item.tone === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-surface border border-ink-200 bg-white p-3.5 shadow-lg"
              >
                <Icon className={cn('mt-0.5 size-5 shrink-0', iconTones[item.tone])} strokeWidth={1.75} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-900">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-sm text-ink-600">{item.description}</p>}
                  {item.action && (
                    <button
                      type="button"
                      onClick={() => {
                        item.action?.onClick()
                        dismiss(item.id)
                      }}
                      className="mt-1.5 text-sm font-semibold text-brand-700 hover:underline"
                    >
                      {item.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="rounded p-0.5 text-ink-400 hover:text-ink-700"
                  aria-label={t('act.close')}
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
