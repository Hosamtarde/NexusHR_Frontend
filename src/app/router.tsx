import { createBrowserRouter, Outlet, type RouteObject } from 'react-router'
import { ForbiddenPage, NotFoundPage, RouteErrorPage } from './ErrorPages'
import { appRoutes, publicRoutes } from './registry'
import { SetupHome } from './SetupPages'

const claimsRoot = (routes: RouteObject[]) => routes.some((route) => route.index || route.path === '/' || route.path === '')

const fallbackHome: RouteObject[] = claimsRoot([...appRoutes, ...publicRoutes]) ? [] : [{ index: true, element: <SetupHome /> }]

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      ...publicRoutes,
      { path: '/403', element: <ForbiddenPage standalone /> },
      { path: '/', element: <Outlet />, children: [...fallbackHome, ...appRoutes] },
      { path: '*', element: <NotFoundPage standalone /> },
    ],
  },
])
