import { useSyncExternalStore } from 'react'

const lists = new Map<string, unknown[]>()
const ticks = new Map<string, number>()
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function readCollection<T>(key: string, seed: () => T[]): T[] {
  if (!lists.has(key)) lists.set(key, seed())
  return lists.get(key) as T[]
}

export function useCollection<T>(key: string, seed: () => T[]): T[] {
  return useSyncExternalStore(subscribe, () => readCollection(key, seed))
}

export function updateCollection<T>(key: string, seed: () => T[], change: (list: T[]) => T[]) {
  lists.set(key, change(readCollection(key, seed)))
  emit()
}

export function bump(key: string) {
  ticks.set(key, (ticks.get(key) ?? 0) + 1)
  emit()
}

export function useTick(key: string) {
  return useSyncExternalStore(subscribe, () => ticks.get(key) ?? 0)
}
