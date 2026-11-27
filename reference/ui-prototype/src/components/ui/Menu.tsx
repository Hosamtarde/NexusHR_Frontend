import { useCallback, useId, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { Floating } from './floating'

interface PopoverProps {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'start' | 'end'
  placement?: 'bottom' | 'top'
  className?: string
  minWidth?: number
}

export function Popover({ trigger, children, align = 'end', placement = 'bottom', className, minWidth }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const close = useCallback(() => setOpen(false), [])

  return (
    <div ref={ref} className='relative'>
      {trigger({ open, toggle: () => setOpen((value) => !value), id })}
      <Floating open={open} anchorRef={ref} onClose={close} align={align} placement={placement} minWidth={minWidth} id={id} className={className}>
        {children(close)}
      </Floating>
    </div>
  )
}

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>

interface MenuItemProps {
  icon?: IconType
  children: ReactNode
  onSelect?: () => void
  to?: string
  tone?: 'default' | 'danger'
}

export function MenuItem({ icon: Icon, children, onSelect, to, tone = 'default' }: MenuItemProps) {
  const classes = cn(
    'flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-start text-base transition-colors',
    tone === 'danger' ? 'text-danger hover:bg-danger-bg' : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900',
  )
  const content = (
    <>
      {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.75} />}
      {children}
    </>
  )
  if (to) {
    return (
      <Link to={to} onClick={onSelect} className={classes} role="menuitem">
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onSelect} className={classes} role="menuitem">
      {content}
    </button>
  )
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-ink-100" role="separator" />
}
