import type { ChatSession, Tokens } from '@/types/auth'

export interface Session {
  tokens: Tokens
  chat: ChatSession | null
}

const storageKey = 'nexushr.session'
const listeners = new Set<() => void>()

const isTokens = (value: unknown): value is Tokens =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Tokens).access_token === 'string' &&
  typeof (value as Tokens).refresh_token === 'string'

const isChat = (value: unknown): value is ChatSession =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ChatSession).user_id === 'string' &&
  typeof (value as ChatSession).auth_token === 'string'

function read(): Session | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { tokens, chat } = parsed as Partial<Session>
    return isTokens(tokens) ? { tokens, chat: isChat(chat) ? chat : null } : null
  } catch {
    return null
  }
}

let current: Session | null = read()

function write(next: Session | null) {
  current = next
  try {
    if (next) window.localStorage.setItem(storageKey, JSON.stringify(next))
    else window.localStorage.removeItem(storageKey)
  } catch {
    current = next
  }
  listeners.forEach((listener) => listener())
}

export const getSession = () => current
export const getAccessToken = () => current?.tokens.access_token ?? null
export const getRefreshToken = () => current?.tokens.refresh_token ?? null
export const getChatSession = () => current?.chat ?? null
export const hasSession = () => current !== null

export function setSession(tokens: Tokens, chat: ChatSession | null) {
  write({ tokens: { access_token: tokens.access_token, refresh_token: tokens.refresh_token }, chat: isChat(chat) ? chat : null })
}

export function clearSession() {
  if (current !== null) write(null)
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey) return
    current = read()
    listeners.forEach((listener) => listener())
  })
}
