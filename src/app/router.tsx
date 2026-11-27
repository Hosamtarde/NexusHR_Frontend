import { createBrowserRouter, type RouteObject } from 'react-router'
import { RedirectIfAuthenticated, RequireAuth, RoleGuard } from './auth'
import { LoginFallback } from './auth/LoginFallback'
import { ForbiddenPage, NotFoundPage, RouteErrorPage } from './ErrorPages'
import { appRoutes, publicRoutes } from './registry'
import { SetupHome } from './SetupPages'

const claims = (routes: RouteObject[], path: string) => routes.some((route) => route.path === path)

const claimsRoot = (routes: RouteObject[]) => routes.some((route) => route.index || route.path === '/' || route.path === '')

const fallbackHome: RouteObject[] = claimsRoot([...appRoutes, ...publicRoutes]) ? [] : [{ index: true, element: <SetupHome /> }]

const fallbackLogin: RouteObject[] = claims(publicRoutes, '/login')
  ? []
  : [{ path: '/login', element: <RedirectIfAuthenticated><LoginFallback /></RedirectIfAuthenticated> }]

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      ...publicRoutes,
      ...fallbackLogin,
      { path: '/403', element: <ForbiddenPage standalone /> },
      {
        path: '/',
        element: <RequireAuth />,
        children: [{ element: <RoleGuard />, children: [...fallbackHome, ...appRoutes] }],
      },
      { path: '*', element: <NotFoundPage standalone /> },
    ],
  },
])
