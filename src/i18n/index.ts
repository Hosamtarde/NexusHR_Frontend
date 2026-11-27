import { useMemo, useSyncExternalStore } from 'react'
import { common } from './common'
import { kitDict } from './kit'
import { setupDict } from './setup'
import { defineBi, defineDict, type Dictionary } from './define'
import { dirOf, getLang, setLang, subscribeLang, type Dir, type Lang, type Localized } from './runtime'

export type { Dictionary, Dir, Lang, Localized }
export { defineBi, defineDict, dirOf, getLang, setLang }

export type TKey = keyof typeof common.ar | keyof typeof kitDict.ar | keyof typeof setupDict.ar
export type Params = Record<string, string | number>

const dictionaries: Record<Lang, Record<string, string>> = {
  ar: { ...common.ar, ...kitDict.ar, ...setupDict.ar },
  en: { ...common.en, ...kitDict.en, ...setupDict.en },
}

export function registerDictionary(dict: Dictionary) {
  Object.assign(dictionaries.ar, dict.ar)
  Object.assign(dictionaries.en, dict.en)
}

const fill = (template: string, params?: Params) =>
  params ? template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match)) : template

export function translate(key: string, params?: Params, lang: Lang = getLang()) {
  return fill(dictionaries[lang][key] ?? dictionaries.ar[key] ?? key, params)
}

export const tr = (key: TKey, params?: Params) => translate(key, params)

export function useLang() {
  return useSyncExternalStore(subscribeLang, getLang)
}

export function useI18n<K extends string = never>(_dict?: Dictionary<K>) {
  const lang = useLang()
  return useMemo(
    () => ({
      lang,
      dir: dirOf(lang),
      isRtl: lang === 'ar',
      t: (key: TKey | K, params?: Params) => translate(key, params, lang),
      text: (value: Localized) => value[lang],
      setLang,
    }),
    [lang],
  )
}
