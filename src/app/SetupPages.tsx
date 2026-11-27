import { useI18n, type TKey } from '@/i18n'
import { env } from '@/lib/env'
import { useAuth } from './auth/context'
import { LanguageToggle } from './ErrorPages'
import { features } from './registry'

export function SetupHome() {
  const { t } = useI18n()
  const { user, chat, logout } = useAuth()
  const rows: [TKey, string][] = [
    ['setup.user', user ? `${user.first_name} ${user.last_name} · ${user.email}` : '—'],
    ['setup.role', user ? t(`role.${user.role}` as TKey) : '—'],
    ['setup.chat', chat ? t('setup.chatOn') : t('setup.chatOff')],
    ['setup.features', String(features.length)],
    ['setup.mock', env.useMock ? t('setup.mockOn') : t('setup.mockOff')],
    ['setup.api', env.apiUrl],
  ]
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-6 p-6">
      <div className="rounded-surface bg-ink-0 p-8 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-brand-700">{t('app.name')}</h1>
          <LanguageToggle />
        </div>
        <p className="mt-1 text-xl font-semibold">{t('setup.title')}</p>
        <p className="mt-2 text-ink-600">{t('setup.desc')}</p>
        <dl className="mt-6 grid gap-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-ink-500">{t(label)}</dt>
              <dd className="text-end font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 rounded-control bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t('auth.signOut')}
        </button>
      </div>
    </main>
  )
}
