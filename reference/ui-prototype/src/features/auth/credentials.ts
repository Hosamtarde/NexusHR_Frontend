const secrets = new Map<number, string>()
const temporary = new Set<number>()

export const verifyPassword = (userId: number, value: string) => (secrets.has(userId) ? secrets.get(userId) === value : value.length >= 6)

export function setPassword(userId: number, value: string, isTemporary: boolean) {
  secrets.set(userId, value)
  if (isTemporary) temporary.add(userId)
  else temporary.delete(userId)
}

export const hasTemporaryPassword = (userId: number) => temporary.has(userId)

const pools = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '@#$%&*']

export function randomPassword(length = 12) {
  const all = pools.join('')
  const pick = (source: string) => source[crypto.getRandomValues(new Uint32Array(1))[0]! % source.length]!
  const chars = [...pools.map(pick), ...Array.from({ length: length - pools.length }, () => pick(all))]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0]! % (i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}

export function downloadFile(name: string, content: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob(['﻿', content], { type: `${type};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
