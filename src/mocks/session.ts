import type { Role, Tokens } from '@/types/auth'
import { findAccount, type MockAccount } from './accounts'
import { fail } from './utils'

const storageKey = 'nexushr.mock.auth'
const ttlKey = 'nexushr.mock.accessTtlSeconds'
const defaultAccessTtlMs = 15 * 60_000
const refreshTtlMs = 7 * 24 * 60 * 60_000

interface RefreshRecord {
  userId: number
  expiresAt: number
  revoked: boolean
}

type Store = Record<string, RefreshRecord>

const memory: { store: Store } = { store: {} }

function load(): Store {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as Store) : memory.store
  } catch {
    return memory.store
  }
}

function save(store: Store) {
  memory.store = store
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(store))
  } catch {
    memory.store = store
  }
}

function accessTtlMs() {
  try {
    const seconds = Number(window.localStorage.getItem(ttlKey))
    return seconds > 0 ? seconds * 1000 : defaultAccessTtlMs
  } catch {
    return defaultAccessTtlMs
  }
}

const random = () => crypto.randomUUID().replace(/-/g, '')

export function issueTokens(userId: number): Tokens {
  const now = Date.now()
  const access_token = `mock.access.${userId}.${now + accessTtlMs()}.${random()}`
  const refresh_token = `mock.refresh.${userId}.${random()}`
  const store = load()
  for (const [token, record] of Object.entries(store)) {
    if (record.expiresAt <= now || record.revoked) delete store[token]
  }
  store[refresh_token] = { userId, expiresAt: now + refreshTtlMs, revoked: false }
  save(store)
  return { access_token, refresh_token }
}

export function revokeAll(userId: number) {
  const store = load()
  for (const record of Object.values(store)) {
    if (record.userId === userId) record.revoked = true
  }
  save(store)
}

export type RotateResult = { ok: true; userId: number } | { ok: false; message: string }

export function consumeRefreshToken(token: string): RotateResult {
  const store = load()
  const record = store[token]
  if (!record || record.revoked) {
    const userId = Number(token.split('.')[2])
    if (Number.isInteger(userId)) revokeAll(userId)
    return { ok: false, message: 'Invalid or expired refresh token' }
  }
  if (record.expiresAt <= Date.now()) return { ok: false, message: 'Invalid or expired refresh token' }
  const account = findAccount(record.userId)
  if (!account || !account.status) {
    revokeAll(record.userId)
    return { ok: false, message: 'Account is inactive or does not exist' }
  }
  record.revoked = true
  save(store)
  return { ok: true, userId: record.userId }
}

export function readAccessToken(header: string | null): MockAccount | null {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  const parts = token?.split('.') ?? []
  if (parts.length !== 5 || parts[0] !== 'mock' || parts[1] !== 'access') return null
  const userId = Number(parts[2])
  const expiresAt = Number(parts[3])
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null
  const account = findAccount(userId)
  return account && account.status ? account : null
}

export function authenticate(request: Request, roles?: readonly Role[]): MockAccount | Response {
  const path = new URL(request.url).pathname
  const account = readAccessToken(request.headers.get('Authorization'))
  if (!account) return fail(401, 'Unauthorized', path)
  if (roles && !roles.includes(account.role)) return fail(403, 'Forbidden resource', path)
  return account
}
