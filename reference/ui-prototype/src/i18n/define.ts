export function defineDict<const A extends Record<string, string>>(ar: A, en: Record<keyof A, string>) {
  return { ar, en }
}
