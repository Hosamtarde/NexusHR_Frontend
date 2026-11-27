import { Link } from 'react-router'
import { useI18n } from '@/i18n'
import { env } from '@/lib/env'
import { features } from './registry'

export function SetupHome() {
  const { t, lang, setLang } = useI18n()
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-6 p-6">
      <div className="rounded-surface bg-ink-0 p-8 shadow-card">
        <h1 className="text-2xl font-semibold text-brand-700">{t('app.name')}</h1>
        <p className="mt-1 text-xl font-semibold">{t('setup.title')}</p>
        <p className="mt-2 text-ink-600">{t('setup.desc')}</p>
        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">{t('setup.features')}</dt>
            <dd className="tabular font-medium">{features.length}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">{t('setup.mock')}</dt>
            <dd className="font-medium">{env.useMock ? t('setup.mockOn') : t('setup.mockOff')}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">{t('setup.api')}</dt>
            <dd className="font-medium" dir="ltr">{env.apiUrl}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="mt-6 rounded-control bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t('setup.switchLang')}
        </button>
      </div>
    </main>
  )
}

export function SetupNotFound() {
  const { t } = useI18n()
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="text-3xl font-semibold text-brand-700">404</p>
        <p className="mt-2 text-ink-600">{t('setup.notFound')}</p>
        <Link to="/" className="mt-4 inline-block text-brand-600 underline">
          {t('setup.home')}
        </Link>
      </div>
    </main>
  )
}
