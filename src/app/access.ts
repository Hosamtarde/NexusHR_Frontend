import { isAppRole, type Role } from '@/types/auth'
import { accessRules } from './registry'

const matcher = (pattern: string) => {
  const source = pattern
    .split('/')
    .map((part) => (part === '*' ? '.+' : part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/')
  return new RegExp(`^${source}/?$`)
}

const weight = (pattern: string) => (pattern.includes('*') ? 2 : pattern.includes(':') ? 1 : 0)

const compiled = accessRules
  .map(([pattern, roles]) => ({ pattern, roles, test: matcher(pattern) }))
  .sort((a, b) => weight(a.pattern) - weight(b.pattern) || b.pattern.length - a.pattern.length)

export function rolesFor(path: string): readonly Role[] | null {
  const clean = path.split('?')[0]!.split('#')[0]!
  return compiled.find((rule) => rule.test.test(clean))?.roles ?? null
}

export function canAccess(role: unknown, path: string) {
  if (!isAppRole(role)) return false
  const roles = rolesFor(path)
  return roles === null || roles.includes(role)
}
