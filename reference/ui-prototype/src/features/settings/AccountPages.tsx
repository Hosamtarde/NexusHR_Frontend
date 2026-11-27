import { useState, type FormEvent } from 'react'
import { useI18n } from '@/i18n'
import { formatDate } from '@/lib/format'
import { employmentTypeLabels, roleLabels } from '@/lib/labels'
import { useAction } from '@/lib/sample'
import { useViewer } from '@/app/viewer-context'
import { Avatar, Badge, Button, ButtonLink, DescriptionList, Field, Input, PageHeader, Panel, useToast } from '@/components/ui'
import { setPassword, verifyPassword } from '@/features/auth/credentials'
import { PasswordInput, PasswordStrength } from '@/features/auth/PasswordInput'
import { skillsOf } from '@/features/skills/data'
import { bump } from '@/store/collections'

export function ProfilePage() {
  const { t } = useI18n()
  const toast = useToast()
  const { user, row, role, userId } = useViewer()
  const { pending, run } = useAction()
  const [first, setFirst] = useState(user.first_name)
  const [last, setLast] = useState(user.last_name)
  const [phone, setPhone] = useState(user.phone_number ?? '')
  const [image, setImage] = useState(user.profile_image ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    if (first.trim().length < 2 || first.trim().length > 100) found.first = t('ac.profile.nameLength')
    if (last.trim().length < 2 || last.trim().length > 100) found.last = t('ac.profile.nameLength')
    if (image.length > 255) found.image = t('ac.profile.imageLength')
    setErrors(found)
    if (Object.keys(found).length) return
    void run(() => {
      user.first_name = first.trim()
      user.last_name = last.trim()
      user.phone_number = phone.trim()
      user.profile_image = image.trim() || null
      bump('people')
      toast.success(t('ac.profile.saved'), t('ac.profile.savedDesc'))
    })
  }

  return (
    <div>
      <PageHeader title={t('ac.profile.title')} />
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Panel>
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar src={user.profile_image} firstName={user.first_name} size="xl" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-ink-900">{row.name}</h2>
              <p className="text-base text-ink-600">{row.profile.position}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Badge tone={roleLabels[role].tone}>{roleLabels[role].label}</Badge>
                {row.department && <Badge>{row.department.department_name}</Badge>}
              </div>
            </div>
            <div className="mt-5 border-t border-ink-100 pt-4">
              <DescriptionList columns={1} items={[{ label: t('k.email'), value: <span dir="ltr">{user.email}</span> }, { label: t('k.manager'), value: row.manager ? `${row.manager.first_name} ${row.manager.last_name}` : t('k.none') }, { label: t('em.col.hire'), value: formatDate(row.profile.hire_date) }, { label: t('em.col.type'), value: employmentTypeLabels[row.profile.employment_type] }]} />
            </div>
          </Panel>
          <Panel title={t('ac.profile.skills')} description={t('ac.profile.skillsDesc', { n: skillsOf(userId).length })}>
            <ButtonLink to="/skills/me" variant="secondary" className="w-full">{t('ac.profile.skillsOpen')}</ButtonLink>
          </Panel>
        </div>
        <form onSubmit={save} noValidate>
          <Panel title={t('ac.profile.contact')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('em.form.first')} error={errors.first}><Input value={first} onChange={(e) => setFirst(e.target.value)} /></Field>
              <Field label={t('em.form.last')} error={errors.last}><Input value={last} onChange={(e) => setLast(e.target.value)} /></Field>
              <Field label={t('k.phone')} optional><Input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              <Field label={t('ac.profile.image')} optional error={errors.image}><Input dir="ltr" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://" /></Field>
            </div>
            <div className="mt-6 flex justify-end"><Button type="submit" loading={pending}>{t('act.save')}</Button></div>
          </Panel>
        </form>
      </div>
    </div>
  )
}

export function ChangePasswordPage() {
  const { t } = useI18n()
  const { userId } = useViewer()
  const toast = useToast()
  const { pending, run } = useAction()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found: Record<string, string> = {}
    if (!verifyPassword(userId, current)) found.current = t('ac.pw.wrong')
    if (next.length < 8) found.next = t('ac.pw.min')
    else if (next === current) found.next = t('ac.pw.same')
    if (confirm !== next) found.confirm = t('auth.reset.mismatch')
    setErrors(found)
    if (Object.keys(found).length) return
    void run(() => {
      setPassword(userId, next, false)
      toast.success(t('ac.pw.saved'), t('ac.pw.savedDesc'))
      setCurrent('')
      setNext('')
      setConfirm('')
    })
  }

  return (
    <div>
      <PageHeader title={t('ac.pw.title')} />
      <div className="grid max-w-xl gap-6">
        <form onSubmit={submit} noValidate>
          <Panel>
            <div className="flex flex-col gap-4">
              <Field label={t('ac.pw.current')} error={errors.current} hint={t('ac.pw.hint')}><PasswordInput autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
              <Field label={t('ac.pw.new')} error={errors.next}><PasswordInput autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
              <PasswordStrength value={next} />
              <Field label={t('ac.pw.confirm')} error={errors.confirm}><PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
            </div>
            <div className="mt-6 flex justify-end"><Button type="submit" loading={pending}>{t('ac.pw.save')}</Button></div>
          </Panel>
        </form>
      </div>
    </div>
  )
}
