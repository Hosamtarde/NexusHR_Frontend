import { setupWorker } from 'msw/browser'
import type { RequestHandler } from 'msw'

const modules = import.meta.glob<RequestHandler[]>('../features/*/mocks.ts', { eager: true, import: 'handlers' })

export const worker = setupWorker(...Object.values(modules).flat())
