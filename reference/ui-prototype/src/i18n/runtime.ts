export type Lang = 'ar' | 'en'
export type Dir = 'rtl' | 'ltr'
export type Localized = { ar: string; en: string }

const storageKey = 'nexushr.lang'

function read(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl
  try {
    return window.localStorage.getItem(storageKey) === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

let current: Lang = read()
const listeners = new Set<() => void>()

export const dirOf = (lang: Lang): Dir => (lang === 'ar' ? 'rtl' : 'ltr')
export const getLang = () => current

function applyDocument() {
  document.documentElement.lang = current
  document.documentElement.dir = dirOf(current)
  document.title = current === 'ar' ? 'NexusHR | إدارة الموارد البشرية' : 'NexusHR | Human Resources Management'
}

applyDocument()

export function setLang(next: Lang) {
  if (next === current) return
  current = next
  try {
    window.localStorage.setItem(storageKey, next)
  } catch {
    current = next
  }
  applyDocument()
  listeners.forEach((listener) => listener())
}

export function subscribeLang(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
