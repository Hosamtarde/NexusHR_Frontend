import type { KeyboardEvent } from 'react'

export function handleMenuKeys(event: KeyboardEvent<HTMLElement>, root: HTMLElement | null) {
  if (!root) return
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(event.key)) return
  const items = [...root.querySelectorAll<HTMLElement>('[role="menuitem"],[role="option"]')].filter((item) => !item.hasAttribute('disabled'))
  if (items.length === 0) return
  event.preventDefault()
  const current = items.indexOf(document.activeElement as HTMLElement)
  let next = current
  if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % items.length
  if (event.key === 'ArrowUp') next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length
  if (event.key === 'Home') next = 0
  if (event.key === 'End') next = items.length - 1
  items[next]?.focus()
}
