import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { handleMenuKeys } from './menuKeys'

export type FloatAlign = 'start' | 'end'
export type FloatPlacement = 'bottom' | 'top'

interface Position {
  top: number
  left: number
  minWidth: number
  maxHeight: number
}

const GAP = 6
const EDGE = 8

function compute(anchor: HTMLElement, node: HTMLElement, placement: FloatPlacement, align: FloatAlign, matchWidth: boolean, minWidth: number): Position {
  const rect = anchor.getBoundingClientRect()
  const rtl = document.documentElement.dir === 'rtl'
  const vw = window.innerWidth
  const vh = window.innerHeight
  const min = Math.max(minWidth, matchWidth ? rect.width : 0)
  node.style.minWidth = `${min}px`
  node.style.maxHeight = ''
  const width = Math.min(node.offsetWidth, vw - EDGE * 2)
  const height = node.offsetHeight
  const alignLeft = (align === 'start') !== rtl
  let left = alignLeft ? rect.left : rect.right - width
  left = Math.min(Math.max(left, EDGE), Math.max(EDGE, vw - width - EDGE))
  const below = vh - rect.bottom - GAP - EDGE
  const above = rect.top - GAP - EDGE
  const preferTop = placement === 'top'
  const useTop = preferTop ? above >= height || above >= below : below < height && above > below
  const room = useTop ? above : below
  const finalHeight = Math.min(height, Math.max(room, 120))
  const top = useTop ? rect.top - GAP - finalHeight : rect.bottom + GAP
  return { top: Math.max(EDGE, top), left, minWidth: min, maxHeight: Math.max(room, 120) }
}

interface FloatingProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
  placement?: FloatPlacement
  align?: FloatAlign
  matchWidth?: boolean
  minWidth?: number
  id?: string
  role?: string
  className?: string
  focusFirst?: boolean
  children: ReactNode
}

export function Floating({ open, anchorRef, onClose, placement = 'bottom', align = 'start', matchWidth, minWidth = 192, id, role, className, focusFirst = true, children }: FloatingProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  const place = useCallback(() => {
    const anchor = anchorRef.current
    const node = nodeRef.current
    if (!anchor || !node) return
    setPosition(compute(anchor, node, placement, align, Boolean(matchWidth), minWidth))
  }, [anchorRef, placement, align, matchWidth, minWidth])

  useLayoutEffect(() => {
    if (!open) return
    place()
  }, [open, place, children])

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (nodeRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      closeRef.current()
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current()
        anchorRef.current?.querySelector<HTMLElement>('button,[tabindex]')?.focus()
      }
    }
    const onScroll = (event: Event) => {
      if (nodeRef.current?.contains(event.target as Node)) return
      closeRef.current()
    }
    const onResize = () => place()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, anchorRef, place])

  useEffect(() => {
    if (!open || !position || !focusFirst) return
    const node = nodeRef.current
    if (!node || node.contains(document.activeElement)) return
    const selected = node.querySelector<HTMLElement>('[aria-selected="true"],[role="menuitem"],[role="option"]')
    selected?.focus()
  }, [open, position, focusFirst])

  if (!open) return null
  return createPortal(
    <div
      ref={nodeRef}
      id={id}
      role={role}
      onKeyDown={(event) => handleMenuKeys(event, nodeRef.current)}
      style={position ? { top: position.top, left: position.left, minWidth: position.minWidth, maxHeight: position.maxHeight } : { top: 0, left: 0, visibility: 'hidden' }}
      className={cn('scrollbar-thin fixed z-[80] animate-scale-in overflow-y-auto rounded-surface border border-ink-200 bg-white shadow-md', className)}
    >
      {children}
    </div>,
    document.body,
  )
}
