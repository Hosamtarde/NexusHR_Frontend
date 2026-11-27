import { http } from 'msw'
import type { LoginRequest, LoginResponse, LogoutResponse, RefreshRequest, RefreshResponse } from '@/types/auth'
import type { ChatSession } from '@/types/auth'
import { findAccount, findAccountByEmail, toMe, type MockAccount } from './accounts'
import { authenticate, consumeRefreshToken, issueTokens, revokeAll } from './session'
import { api, fail, latency, ok } from './utils'

const loginLimit = 5
const windowMs = 60_000
let attempts: number[] = []

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const chatFor = (account: MockAccount): ChatSession => ({
  user_id: `rc${String(account.user_id).padStart(4, '0')}`,
  auth_token: crypto.randomUUID(),
})

async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    const body: unknown = await request.json()
    return typeof body === 'object' && body !== null ? (body as Partial<T>) : {}
  } catch {
    return {}
  }
}

function validateLogin(body: Partial<LoginRequest>) {
  const messages: string[] = []
  if (typeof body.email !== 'string' || !emailPattern.test(body.email)) messages.push('Please provide a valid email')
  if (typeof body.password !== 'string' || body.password.length === 0) messages.push('Password is required')
  if (typeof body.password !== 'string' || body.password.length < 6) messages.push('Password must be at least 6 characters')
  return messages
}

export const handlers = [
  http.post(api('/auth/login'), async ({ request }) => {
    await latency()
    const now = Date.now()
    attempts = attempts.filter((time) => now - time < windowMs)
    if (attempts.length >= loginLimit) return fail(429, 'ThrottlerException: Too Many Requests', '/auth/login')
    attempts.push(now)

    const body = await readJson<LoginRequest>(request)
    const messages = validateLogin(body)
    if (messages.length > 0) return fail(400, messages, '/auth/login')

    const account = findAccountByEmail(body.email!)
    if (!account || account.password !== body.password) return fail(401, 'Invalid email or password', '/auth/login')
    if (!account.status) return fail(401, 'Account is inactive', '/auth/login')

    const { password: _password, phone_number: _phone, profile_image: _image, status: _status, ...user } = account
    const data: LoginResponse = { ...issueTokens(account.user_id), chat: chatFor(account), user }
    return ok(data)
  }),

  http.post(api('/auth/refresh'), async ({ request }) => {
    await latency()
    const body = await readJson<RefreshRequest>(request)
    if (typeof body.refresh_token !== 'string' || body.refresh_token.length === 0) {
      return fail(401, 'Invalid or expired refresh token', '/auth/refresh')
    }
    const result = consumeRefreshToken(body.refresh_token)
    if (!result.ok) return fail(401, result.message, '/auth/refresh')
    const account = findAccount(result.userId)!
    const data: RefreshResponse = { ...issueTokens(account.user_id), chat: chatFor(account) }
    return ok(data)
  }),

  http.get(api('/auth/me'), async ({ request }) => {
    await latency()
    const account = authenticate(request)
    if (account instanceof Response) return account
    return ok(toMe(account))
  }),

  http.post(api('/auth/logout'), async ({ request }) => {
    await latency()
    const account = authenticate(request)
    if (account instanceof Response) return account
    revokeAll(account.user_id)
    const data: LogoutResponse = { message: 'Logged out successfully' }
    return ok(data)
  }),
]
