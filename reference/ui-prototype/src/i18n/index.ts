import { useMemo, useSyncExternalStore } from 'react'
import { dictionaries, type TKey } from './dictionaries'
import { dirOf, getLang, setLang, subscribeLang, type Lang, type Localized } from './runtime'

export type { Lang, Localized, TKey }
export { getLang, setLang }

export type Params = Record<string, string | number>

export function translate(key: TKey, params?: Params, lang: Lang = getLang()) {
  const template = dictionaries[lang][key] ?? dictionaries.ar[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

export const tr = (key: TKey, params?: Params) => translate(key, params)

export function useI18n() {
  const lang = useSyncExternalStore(subscribeLang, getLang)
  return useMemo(
    () => ({
      lang,
      dir: dirOf(lang),
      isRtl: lang === 'ar',
      t: (key: TKey, params?: Params) => translate(key, params, lang),
      text: (value: Localized) => value[lang],
      setLang,
    }),
    [lang],
  )
}
