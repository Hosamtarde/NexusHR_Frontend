import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { Button, IconButton, type ButtonVariant } from './Button'

const focusable =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

function useDialogBehavior(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const node = ref.current
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(focusable)
    first?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
      }
      if (event.key === 'Tab' && node) {
        const items = [...node.querySelectorAll<HTMLElement>(focusable)]
        if (items.length === 0) return
        const firstItem = items[0]!
        const lastItem = items[items.length - 1]!
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault()
          lastItem.focus()
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault()
          firstItem.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open])

  return ref
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: ReactNode
  children?: ReactNode
}

export function Modal({ open, onClose, title, description, size = 'md', footer, children }: ModalProps) {
  const { t } = useI18n()
  const ref = useDialogBehavior(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-brand-950/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-scale-in flex-col rounded-t-dialog bg-white shadow-lg sm:rounded-dialog',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-lg',
          size === 'lg' && 'sm:max-w-3xl',
        )}
      >
        <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-1 text-base text-ink-600">{description}</p>}
          </div>
          <IconButton icon={X} label={t('act.close')} size="sm" onClick={onClose} className="-me-1.5 -mt-1" />
        </header>
        {children && <div className="scrollbar-thin overflow-y-auto px-5 pb-5">{children}</div>}
        {footer && (
          <footer className="flex flex-col-reverse gap-2 border-t border-ink-100 bg-ink-25 px-5 py-3 sm:flex-row sm:justify-end sm:rounded-b-dialog">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  loading,
  children,
}: ConfirmDialogProps) {
  const { t } = useI18n()
  const variant: ButtonVariant = tone === 'danger' ? 'danger' : 'primary'
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-autofocus>
            {cancelLabel ?? t('act.cancel')}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  side?: 'start' | 'end'
  width?: 'sm' | 'md'
  panelClassName?: string
  hideHeader?: boolean
  footer?: ReactNode
  children: ReactNode
}

export function Drawer({ open, onClose, title, description, side = 'end', width = 'md', panelClassName, hideHeader, footer, children }: DrawerProps) {
  const { t } = useI18n()
  const ref = useDialogBehavior(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-brand-950/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 flex w-full flex-col shadow-lg',
          panelClassName ?? 'bg-white',
          width === 'sm' ? 'max-w-xs' : 'max-w-md',
          side === 'start' ? 'start-0 animate-drawer-start' : 'end-0 animate-drawer-end',
        )}
      >
        {!hideHeader && (
        <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          <IconButton icon={X} label={t('act.close')} size="sm" onClick={onClose} className="-me-1.5" />
        </header>
        )}
        <div className="scrollbar-thin flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="flex gap-2 border-t border-ink-100 px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
