import { getLang, type Localized } from './runtime'

export function localize<T extends object>(base: T, fields: Record<string, Localized>): T {
  const copy = { ...base }
  for (const [key, value] of Object.entries(fields)) {
    Object.defineProperty(copy, key, { enumerable: true, configurable: true, get: () => value[getLang()] })
  }
  return copy
}

export const pick = (value: Localized) => value[getLang()]
