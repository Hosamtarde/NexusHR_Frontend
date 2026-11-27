import { createBrowserRouter, Outlet, type RouteObject } from 'react-router'
import { appRoutes, publicRoutes } from './registry'
import { SetupHome, SetupNotFound } from './SetupPages'

const claimsRoot = (routes: RouteObject[]) => routes.some((route) => route.index || route.path === '/' || route.path === '')

const fallbackHome: RouteObject[] = claimsRoot([...appRoutes, ...publicRoutes]) ? [] : [{ index: true, element: <SetupHome /> }]

export const router = createBrowserRouter([
  ...publicRoutes,
  { path: '/', element: <Outlet />, children: [...fallbackHome, ...appRoutes] },
  { path: '*', element: <SetupNotFound /> },
])
