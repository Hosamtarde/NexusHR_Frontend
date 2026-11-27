const flag = (value: string | undefined, fallback: boolean) => (value === undefined || value === '' ? fallback : value === 'true')

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  useMock: flag(import.meta.env.VITE_USE_MOCK, true),
  enablePlanned: flag(import.meta.env.VITE_ENABLE_PLANNED, false),
}
