import { Link } from 'react-router'
import { ChartColumn, ChevronDown, MessagesSquare, UserPlus, type LucideIcon } from 'lucide-react'
import { useI18n, type TKey } from '@/i18n'
import { Logo } from '@/components/layout/Logo'
import { LanguageSwitch } from '@/components/layout/TopbarParts'
import { ButtonLink } from '@/components/ui'
import { NameArt } from './NameArt'

const roles = ['employee', 'manager', 'hr'] as const
const blocks = [
  { id: 'b1', shot: 'people' },
  { id: 'b2', shot: 'req' },
  { id: 'b3', shot: 'pay' },
  { id: 'b4', shot: 'smart' },
] as const
const more: { id: 'recruitment' | 'messages' | 'reports'; icon: LucideIcon }[] = [
  { id: 'recruitment', icon: UserPlus },
  { id: 'messages', icon: MessagesSquare },
  { id: 'reports', icon: ChartColumn },
]
const faq = [1, 2, 3, 4, 5, 6] as const
const facts = [
  { value: '10', key: 'lp.fact1' },
  { value: '3', key: 'lp.fact2' },
  { value: '2', key: 'lp.fact3' },
] as const

const container = 'mx-auto w-full max-w-[1200px] px-5 sm:px-8'

function Shot({ name, alt, lazy, className }: { name: string; alt: string; lazy?: boolean; className?: string }) {
  const { lang } = useI18n()
  return (
    <img
      src={`/landing/${name}-${lang}.png`}
      alt={alt}
      width={2000}
      height={1400}
      loading={lazy ? 'lazy' : undefined}
      className={`block h-auto w-full rounded-surface border border-ink-200 bg-white shadow-md ${className ?? ''}`}
    />
  )
}

export function LandingPage() {
  const { t } = useI18n()
  return (
    <div className="min-h-dvh bg-white text-ink-900">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className={`${container} flex h-16 items-center justify-between gap-4`}>
          <Logo to="/" />
          <nav className="hidden items-center gap-7 text-base font-medium text-ink-700 md:flex">
            <a href="#modules" className="rounded hover:text-brand-700">{t('lp.nav.modules')}</a>
            <a href="#roles" className="rounded hover:text-brand-700">{t('lp.nav.roles')}</a>
            <a href="#faq" className="rounded hover:text-brand-700">{t('lp.faq.title')}</a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            <LanguageSwitch />
            <Link to="/careers" className="hidden rounded px-1 py-2 text-base font-medium text-ink-700 hover:text-brand-700 sm:block">{t('lp.careers')}</Link>
            <ButtonLink to="/login">{t('auth.submit')}</ButtonLink>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="overflow-hidden bg-brand-50">
          <div className={`${container} pt-12 text-center lg:pt-20`}>
            <p className="text-base font-semibold text-brand-700">{t('lp.eyebrow')}</p>
            <h1 className="mx-auto mt-3 max-w-3xl text-3xl leading-[1.3] font-bold tracking-tight text-balance text-ink-900 sm:text-5xl">{t('lp.h1')}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-ink-600">{t('lp.sub')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/login" size="lg">{t('auth.submit')}</ButtonLink>
              <ButtonLink to="/careers" size="lg" variant="secondary">{t('lp.positions')}</ButtonLink>
            </div>
          </div>
          <div className="mt-10 flex justify-center lg:mt-14" dir="ltr">
            <NameArt />
          </div>
        </section>

        <section className="border-y border-ink-200 bg-white py-12 sm:py-16">
          <div className={container}>
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">{t('lp.facts.title')}</h2>
            <dl className="mt-8 grid gap-8 text-center sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.key}>
                  <dt className="tabular text-5xl font-bold text-brand-700">{fact.value}</dt>
                  <dd className="mt-2 text-lg text-ink-700">{t(fact.key)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="modules" className="scroll-mt-16 bg-white py-14 sm:py-20">
          <div className={container}>
            <h2 className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight text-balance sm:text-4xl">{t('lp.blocks.title')}</h2>
            <div className="mt-14 flex flex-col gap-20 sm:gap-28">
              {blocks.map((block, index) => (
                <div key={block.id} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                  <div className={index % 2 === 1 ? 'lg:order-2' : undefined}>
                    <h3 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{t(`lp.${block.id}.t` as TKey)}</h3>
                    <p className="mt-4 text-lg leading-8 text-ink-600">{t(`lp.${block.id}.d` as TKey)}</p>
                    <ul className="mt-6 border-t border-ink-200">
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n} className="border-b border-ink-200 py-3 text-base font-medium text-ink-800">{t(`lp.${block.id}.${n}` as TKey)}</li>
                      ))}
                    </ul>
                  </div>
                  <Shot name={block.shot} alt={t(`lp.shot.${block.shot}` as TKey)} lazy />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-ink-200 bg-brand-50 py-14 sm:py-20">
          <div className={container}>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('lp.more.title')}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {more.map(({ id, icon: Icon }) => (
                <div key={id} className="rounded-surface border border-ink-200 bg-white p-6">
                  <Icon className="size-8 text-brand-600" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold text-ink-900">{t(`lp.mt.${id}` as TKey)}</h3>
                  <p className="mt-2 text-base leading-7 text-ink-600">{t(`lp.mf.${id}` as TKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="scroll-mt-16 bg-white py-14 sm:py-20">
          <div className={container}>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('lp.roles.title')}</h2>
            <dl className="mt-8 grid gap-8 md:grid-cols-3">
              {roles.map((role) => (
                <div key={role} className="border-t-2 border-brand-600 pt-4">
                  <dt className="text-lg font-semibold text-ink-900">{t(`lp.rt.${role}` as TKey)}</dt>
                  <dd className="mt-2 text-base leading-7 text-ink-700">{t(`lp.rd.${role}` as TKey)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="faq" className="scroll-mt-16 border-t border-ink-200 bg-brand-50 py-14 sm:py-20">
          <div className={`${container} max-w-[860px]`}>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('lp.faq.title')}</h2>
            <div className="mt-8 border-t border-ink-300">
              {faq.map((n) => (
                <details key={n} className="group border-b border-ink-300">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded py-5 text-lg font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                    {t(`lp.q${n}` as TKey)}
                    <ChevronDown className="size-5 shrink-0 text-ink-500 transition-transform group-open:rotate-180" strokeWidth={1.75} aria-hidden />
                  </summary>
                  <p className="pb-5 text-base leading-7 text-ink-700">{t(`lp.a${n}` as TKey)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-700 py-12 text-white sm:py-14">
          <div className={`${container} flex flex-wrap items-center justify-between gap-6`}>
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('lp.cta.title')}</h2>
              <p className="mt-2 text-base text-white/80">{t('lp.cta.note')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/login" size="lg" variant="secondary" className="border-transparent bg-white font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-white">
                {t('auth.submit')}
              </ButtonLink>
              <ButtonLink to="/careers" size="lg" variant="ghost" className="border border-white/50 text-white hover:bg-white/10 hover:text-white focus-visible:outline-white">
                {t('lp.positions')}
              </ButtonLink>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-ink-200 bg-white py-8">
        <div className={`${container} flex flex-wrap items-start justify-between gap-8`}>
          <Logo to="/" />
          <nav aria-label={t('lp.nav.modules')} className="flex flex-wrap gap-x-8 gap-y-3 text-base text-ink-700">
            <a href="#modules" className="rounded hover:text-brand-700">{t('lp.nav.modules')}</a>
            <a href="#roles" className="rounded hover:text-brand-700">{t('lp.nav.roles')}</a>
            <Link to="/careers" className="rounded hover:text-brand-700">{t('lp.careers')}</Link>
            <Link to="/login" className="rounded hover:text-brand-700">{t('auth.submit')}</Link>
          </nav>
          <p className="w-full text-sm text-ink-600">{t('au.footer.copy', { year: 2026 })}</p>
        </div>
      </footer>
    </div>
  )
}
