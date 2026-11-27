import { useCallback, useId, useRef, useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Floating } from './floating'

export function InfoTip({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLSpanElement>(null)
  const id = useId()
  const close = useCallback(() => setOpen(false), [])
  return (
    <span ref={anchor} className={cn('relative inline-flex', className)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label={label} aria-describedby={open ? id : undefined} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} className="grid size-5 place-items-center rounded-full text-ink-400 hover:text-brand-700 focus-visible:text-brand-700">
        <Info className="size-4" strokeWidth={1.75} aria-hidden />
      </button>
      <Floating open={open} anchorRef={anchor} onClose={close} align="start" minWidth={224} id={id} role="tooltip" focusFirst={false} className="max-w-xs p-3 text-sm text-ink-700">
        {children}
      </Floating>
    </span>
  )
}
