import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { users } from '@/features/employees/data'
import { verifyPassword } from './credentials'
import { useNavigate, useSearchParams } from 'react-router'
import { LogIn, Mail, TriangleAlert } from 'lucide-react'
import { Button, Field, Input, Notice } from '@/components/ui'
import { useI18n } from '@/i18n'
import { roleLabels } from '@/lib/labels'
import { useViewer } from '@/app/viewer-context'
import type { Role } from '@/types/entities'
import { AuthLayout } from './AuthLayout'
import { PasswordInput } from './PasswordInput'

type LoginError = 'invalid' | 'throttled' | 'locked' | null

const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value)

export function LoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { setRole, signIn } = useViewer()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [caps, setCaps] = useState(false)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState<LoginError>(params.get('error') === 'throttled' ? 'throttled' : params.get('error') === 'locked' ? 'locked' : null)
  const [touched, setTouched] = useState(false)

  const emailError = touched && !isEmail(email) ? t('auth.errEmail') : undefined
  const passwordError = touched && password.length === 0 ? t('auth.errPassword') : undefined

  const enter = (to: string) => {
    setDone(true)
    signIn()
    window.setTimeout(() => navigate(to, { replace: true }), 700)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!isEmail(email) || password.length === 0 || error === 'locked') return
    setPending(true)
    setError(null)
    window.setTimeout(() => {
      setPending(false)
      const account = users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase())
      if (account ? !verifyPassword(account.user_id, password) : password.length < 6) {
        const next = attempts + 1
        setAttempts(next)
        setError(next >= 3 ? 'locked' : 'invalid')
        return
      }
      enter(params.get('next') ?? '/')
    }, 700)
  }

  const quick = (role: Role) => {
    setRole(role)
    enter('/')
  }

  const keys = (event: KeyboardEvent<HTMLElement>) => setCaps(event.getModifierState('CapsLock'))

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-ink-900">{t('au.welcome')}</h1>

      <div className="mt-6 flex flex-col gap-3" aria-live="polite">
        {done && (
          <Notice tone="success">{t('au.success')}</Notice>
        )}
        {error === 'invalid' && (
          <Notice tone="danger" title={t('auth.invalidTitle')}>
            {t('auth.invalidMsg')}
          </Notice>
        )}
        {error === 'locked' && (
          <Notice tone="danger" title={t('au.lockedTitle')}>
            {t('au.lockedMsg')}
          </Notice>
        )}
        {error === 'throttled' && (
          <Notice tone="warning" title={t('auth.throttledTitle')}>
            {t('auth.throttledMsg')}
          </Notice>
        )}
      </div>

      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
        <Field label={t('auth.email')} error={emailError}>
          <Input type="email" autoComplete="username" dir="ltr" className="text-start" leading={<Mail className="size-4" strokeWidth={1.75} />} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
        </Field>
        <Field label={t('auth.password')} error={passwordError} hint={caps ? <span className="flex items-center gap-1.5 text-warning"><TriangleAlert className="size-4" strokeWidth={1.75} />{t('au.caps')}</span> : undefined}>
          <PasswordInput autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={keys} onKeyUp={keys} onBlur={() => setCaps(false)} />
        </Field>
        <Button type="submit" size="lg" icon={LogIn} loading={pending} disabled={done} className="w-full">
          {t('auth.submit')}
        </Button>
      </form>

      <div className="mt-10 rounded-xl border-2 border-dashed border-warning/40 bg-warning-bg/40 p-4">
        <p className="text-sm font-semibold text-ink-800">{t('au.proto.title')}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(['hr_admin', 'manager', 'employee'] as Role[]).map((role) => (
            <Button key={role} type="button" variant="secondary" size="sm" onClick={() => quick(role)}>
              {roleLabels[role].label}
            </Button>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
