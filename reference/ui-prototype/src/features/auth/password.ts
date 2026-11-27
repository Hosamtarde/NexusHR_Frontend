import type { TKey } from '@/i18n'

export const passwordRules: { label: TKey; test: (value: string) => boolean }[] = [
  { label: 'pw.rule.length', test: (value) => value.length >= 8 },
  { label: 'pw.rule.case', test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: 'pw.rule.digit', test: (value) => /\d/.test(value) },
  { label: 'pw.rule.symbol', test: (value) => /[^A-Za-z0-9]/.test(value) },
]

export const passwordScore = (value: string) => passwordRules.filter((rule) => rule.test(value)).length
