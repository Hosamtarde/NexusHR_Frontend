import { useSyncExternalStore } from 'react'

export type ChatState = 'connecting' | 'ready' | 'unavailable' | 'expired' | 'reconnecting'

const forced = new URLSearchParams(window.location.search).get('chat')
let state: ChatState = forced === 'unavailable' ? 'unavailable' : forced === 'connecting' ? 'connecting' : forced === 'expired' ? 'ready' : 'connecting'
const listeners = new Set<() => void>()

function set(next: ChatState) {
  state = next
  listeners.forEach((listener) => listener())
}

if (forced === null) window.setTimeout(() => set('ready'), 700)
if (forced === 'expired') window.setTimeout(() => set('expired'), 2500)

export const retryChat = () => {
  set('connecting')
  window.setTimeout(() => set('ready'), 900)
}

export const reconnectChat = () => {
  set('reconnecting')
  window.setTimeout(() => set('ready'), 900)
}

export function useChatState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}
