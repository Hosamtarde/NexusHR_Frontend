export function defineBi<const D extends Record<string, readonly [string, string]>>(entries: D) {
  const ar = {} as { [K in keyof D]: string }
  const en = {} as { [K in keyof D]: string }
  for (const key of Object.keys(entries) as (keyof D)[]) {
    ar[key] = entries[key]![0]
    en[key] = entries[key]![1]
  }
  return { ar, en }
}
