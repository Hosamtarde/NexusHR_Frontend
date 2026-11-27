import type { LucideIcon } from 'lucide-react'
import type { RouteObject } from 'react-router'
import type { Dictionary } from '@/i18n'
import type { Role } from '@/types/common'

export type AccessRule = readonly [pattern: string, roles: readonly Role[]]

export interface NavTab {
  label: string
  to: string
  roles?: readonly Role[]
}

export interface NavItem {
  id: string
  label: string
  to: string
  icon?: LucideIcon
  group?: string
  order?: number
  paths?: readonly string[]
  tabs?: readonly NavTab[]
  roles?: readonly Role[]
}

export interface FeatureModule {
  id: string
  planned?: boolean
  routes?: RouteObject[]
  publicRoutes?: RouteObject[]
  access?: readonly AccessRule[]
  nav?: readonly NavItem[]
  dictionary?: Dictionary
}

export const defineFeature = (feature: FeatureModule) => feature
