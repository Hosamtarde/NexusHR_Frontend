import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/i18n'
import { useAction } from '@/lib/sample'
import { Button, Field, FileDrop, Input, SuggestInput } from '@/components/ui'
import { Logo } from '@/components/layout/Logo'
import { LanguageSwitch } from '@/components/layout/TopbarParts'
import { HeroBanner } from '@/components/shared/Cards'
import { submitApplication } from '@/store'
import { positionSuggestions } from './data'

const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value)
const HOUR = 3600000
const sent: number[] = []

export function CareersPage() {
  const { t, text } = useI18n()
  const { pending, run } = useAction()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | undefined>()
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState(false)
  const [limited, setLimited] = useState(false)

  const errors = {
    name: !name.trim() ? t('rc.apply.errName') : name.trim().length > 100 ? t('rc.apply.errLong') : undefined,
    email: !isEmail(email) ? t('rc.apply.errEmail') : undefined,
    position: !position.trim() ? t('rc.apply.errPosition') : position.trim().length > 100 ? t('rc.apply.errLong') : undefined,
    cv: !file ? t('rc.apply.errCv') : undefined,
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (errors.name || errors.email || errors.position || errors.cv || fileError) return
    const now = Date.now()
    const recent = sent.filter((time) => now - time < HOUR)
    if (recent.length >= 3) {
      setLimited(true)
      return
    }
    setLimited(false)
    void run(() => {
      sent.splice(0, sent.length, ...recent, now)
      submitApplication({ name: name.trim(), email: email.trim(), phone: phone.trim(), position: position.trim(), cv: file?.name ?? 'cv.pdf' })
      setDone(true)
    }, 800)
  }

  const reset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setPosition('')
    setFile(null)
    setFileError(undefined)
    setTouched(false)
    setDone(false)
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Logo to="/careers" />
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <Link to="/login" className="hidden text-sm font-medium text-brand-700 hover:underline sm:inline">
            {t('rc.careers.back')}
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-16 sm:px-6">
        <HeroBanner title={t('rc.careers.title')} summary={t('rc.careers.desc')} />
        <section aria-labelledby="apply-title" className="mx-auto w-full max-w-2xl rounded-surface border border-ink-200/80 bg-white p-6 shadow-card">
          {done ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-success-bg text-success">
                <CheckCircle2 className="size-7" strokeWidth={1.5} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink-900">{t('rc.apply.doneTitle')}</h2>
              <p className="mt-1 text-sm text-ink-600">{t('rc.apply.doneDesc')}</p>
              <Button className="mt-6" onClick={reset}>{t('rc.apply.another')}</Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              <div>
                <h2 id="apply-title" className="text-lg font-semibold text-ink-900">{t('rc.careers.formTitle')}</h2>
                <p className="mt-1 text-sm text-ink-600">{t('rc.careers.limits')}</p>
              </div>
              <Field label={t('rc.apply.position')} error={touched ? errors.position : undefined}>
                <SuggestInput
                  value={position}
                  onChange={setPosition}
                  suggestions={positionSuggestions.map((item) => text(item))}
                  otherLabel={t('rc.apply.other')}
                  placeholder={t('rc.apply.positionPlaceholder')}
                  hint={t('rc.apply.positionHint')}
                  maxLength={100}
                />
              </Field>
              <Field label={t('rc.apply.name')} error={touched ? errors.name : undefined}>
                <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('rc.apply.email')} error={touched ? errors.email : undefined}>
                  <Input type="email" dir="ltr" className="text-start" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
                </Field>
                <Field label={t('rc.apply.phone')} optional>
                  <Input type="tel" dir="ltr" className="text-start" maxLength={20} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
                </Field>
              </div>
              <Field label={t('rc.apply.cv')} error={touched ? (fileError ?? errors.cv) : undefined}>
                <FileDrop file={file} onChange={setFile} error={fileError} onError={setFileError} />
              </Field>
              {limited && <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{t('rc.apply.tooMany')}</p>}
              <div className="flex justify-end">
                <Button type="submit" loading={pending}>{t('rc.apply.submit')}</Button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}
