export interface Tokens {
  access_token: string
  refresh_token: string
}

const storageKey = 'nexushr.tokens'

function read(): Tokens | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

let tokens: Tokens | null = read()

export const getTokens = () => tokens
export const getAccessToken = () => tokens?.access_token ?? null

export function setTokens(next: Tokens | null) {
  tokens = next
  try {
    if (next) window.localStorage.setItem(storageKey, JSON.stringify(next))
    else window.localStorage.removeItem(storageKey)
  } catch {
    tokens = next
  }
}
