import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useI18n } from '@/i18n'
import { Button, ConfirmDialog, Modal, useToast } from '@/components/ui'
import { useViewer } from '@/app/viewer-context'
import { randomPassword, setPassword } from '@/features/auth/credentials'
import { logActivity } from '@/features/settings/data'

interface ResetPasswordProps {
  userId: number
  name: string
  open: boolean
  onClose: () => void
}

export function ResetPassword({ userId, name, open, onClose }: ResetPasswordProps) {
  const { t } = useI18n()
  const toast = useToast()
  const { userId: actor } = useViewer()
  const [issued, setIssued] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const confirm = () => {
    const next = randomPassword()
    setPassword(userId, next, true)
    logActivity(actor, 'update', 'users', userId, 'PATCH', `/users/${userId}/password`)
    setIssued(next)
    toast.success(t('em.reset.done', { name }))
  }

  const copy = () => {
    if (!issued) return
    void navigator.clipboard?.writeText(issued)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const finish = () => {
    setIssued(null)
    setCopied(false)
    onClose()
  }

  return (
    <>
      <ConfirmDialog open={open && issued === null} onClose={onClose} onConfirm={confirm} title={t('em.reset.title', { name })} description={t('em.reset.desc')} confirmLabel={t('em.reset.confirm')} />
      <Modal open={issued !== null} onClose={finish} size="sm" title={t('em.reset.shownTitle')} footer={<Button onClick={finish}>{t('act.close')}</Button>}>
        <p className="text-base text-ink-700">{t('em.reset.shownDesc', { name })}</p>
        <div className="mt-4 flex items-center gap-2 rounded-control border border-ink-200 bg-ink-50 p-3">
          <code dir="ltr" className="tabular min-w-0 flex-1 select-all break-all text-lg font-semibold text-ink-900">{issued}</code>
          <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={copy}>{copied ? t('em.reset.copied') : t('em.reset.copy')}</Button>
        </div>
        <p className="mt-3 text-sm text-warning">{t('em.reset.once')}</p>
      </Modal>
    </>
  )
}
