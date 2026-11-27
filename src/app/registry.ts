import { env } from '@/lib/env'
import { registerDictionary } from '@/i18n'
import type { FeatureModule } from './feature'

const modules = import.meta.glob<FeatureModule>('../features/*/index.ts', { eager: true, import: 'default' })

export const features: FeatureModule[] = Object.values(modules)
  .filter((feature) => env.enablePlanned || !feature.planned)
  .sort((a, b) => a.id.localeCompare(b.id))

for (const feature of features) {
  if (feature.dictionary) registerDictionary(feature.dictionary)
}

export const appRoutes = features.flatMap((feature) => feature.routes ?? [])
export const publicRoutes = features.flatMap((feature) => feature.publicRoutes ?? [])
export const accessRules = features.flatMap((feature) => feature.access ?? [])
export const navItems = features.flatMap((feature) => feature.nav ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
