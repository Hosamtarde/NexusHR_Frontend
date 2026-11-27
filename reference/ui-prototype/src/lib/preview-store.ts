import { useSyncExternalStore } from 'react'

export type PreviewState = 'loading' | 'error' | 'empty'

export function parsePreviewState(value: string | null): PreviewState | null {
  return value === 'loading' || value === 'error' || value === 'empty' ? value : null
}

let current: PreviewState | null = parsePreviewState(new URLSearchParams(window.location.search).get('state'))
const listeners = new Set<() => void>()

export function setPreviewState(next: PreviewState | null) {
  current = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function usePreviewState() {
  return useSyncExternalStore(subscribe, () => current)
}
