import { useSyncExternalStore } from 'react'

const sidebarKey = 'nexushr.sidebar'
const listeners = new Set<() => void>()

function readCollapsed() {
  try {
    return window.localStorage.getItem(sidebarKey) === 'collapsed'
  } catch {
    return false
  }
}

let collapsed = readCollapsed()
let paletteOpen = false

const emit = () => listeners.forEach((listener) => listener())

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setSidebarCollapsed(next: boolean) {
  collapsed = next
  try {
    window.localStorage.setItem(sidebarKey, next ? 'collapsed' : 'expanded')
  } catch {
    collapsed = next
  }
  emit()
}

export function setPaletteOpen(next: boolean) {
  paletteOpen = next
  emit()
}

export const useSidebarCollapsed = () => useSyncExternalStore(subscribe, () => collapsed)
export const usePaletteOpen = () => useSyncExternalStore(subscribe, () => paletteOpen)

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (listener) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    },
    () => window.matchMedia(query).matches,
  )
}
