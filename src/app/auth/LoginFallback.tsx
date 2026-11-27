import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useI18n, type TKey } from '@/i18n'
import { env } from '@/lib/env'
import { toApiError } from '@/lib/http'
import { demoAccounts } from '@/mocks/accounts'
import { LanguageToggle } from '../ErrorPages'
import { useAuth } from './context'
import type { FromState } from './guards'

const inputClass =
  'mt-1 w-full rounded-control border border-ink-200 bg-ink-0 px-3 py-2 text-base text-ink-900 outline-none focus:border-brand-500'

export function LoginFallback() {
  const { t } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  async function signIn(credentials: { email: string; password: string }) {
    setPending(true)
    setErrors([])
    try {
      await login(credentials)
      const from = (location.state as FromState | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    } catch (error) {
      setErrors(toApiError(error).messages)
    } finally {
      setPending(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void signIn({ email, password })
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-6 p-6">
      <div className="rounded-surface bg-ink-0 p-8 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-brand-700">{t('app.name')}</h1>
          <LanguageToggle />
        </div>
        <p className="mt-2 text-sm text-ink-500">{t('auth.placeholder')}</p>
        <form onSubmit={submit} className="mt-6 grid gap-4" noValidate>
          <label className="text-sm font-medium text-ink-700">
            {t('auth.email')}
            <input
              type="email"
              dir="ltr"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            {t('auth.password')}
            <input
              type="password"
              dir="ltr"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </label>
          {errors.length > 0 && (
            <ul role="alert" className="rounded-control border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-control bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>
        {env.useMock && (
          <div className="mt-6 border-t border-ink-100 pt-4">
            <p className="text-sm font-medium text-ink-600">{t('auth.demo')}</p>
            <div className="mt-3 grid gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={pending}
                  onClick={() => void signIn({ email: account.email, password: account.password })}
                  className="flex items-center justify-between gap-3 rounded-control border border-ink-200 px-3 py-2 text-sm hover:bg-ink-50 disabled:opacity-60"
                >
                  <span className="font-medium">{t(`role.${account.role}` as TKey)}</span>
                  <span className="text-ink-500" dir="ltr">
                    {account.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
