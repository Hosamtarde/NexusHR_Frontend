import type { RequestHandler } from 'msw'
import { handlers as authHandlers } from './auth'

const modules = import.meta.glob<RequestHandler[]>('../features/*/mocks.ts', { eager: true, import: 'handlers' })

export const handlers: RequestHandler[] = [...authHandlers, ...Object.values(modules).flat()]
