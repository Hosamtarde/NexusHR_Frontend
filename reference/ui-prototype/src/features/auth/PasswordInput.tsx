import { useState, type InputHTMLAttributes } from 'react'
import { Check, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n, type TKey } from '@/i18n'
import { Input } from '@/components/ui'
import { passwordRules, passwordScore } from './password'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean
}

export function PasswordInput({ className, ...rest }: PasswordInputProps) {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  return (
    <Input
      {...rest}
      type={show ? 'text' : 'password'}
      dir="ltr"
      className={cn('text-start', className)}
      trailing={
        <button
          type="button"
          onClick={() => setShow((value) => !value)}
          className="grid size-7 place-items-center rounded text-ink-500 hover:text-ink-800"
          aria-label={show ? t('pw.hide') : t('pw.show')}
          aria-pressed={show}
        >
          {show ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}
        </button>
      }
    />
  )
}

const levels = [
  { color: 'bg-danger', text: 'text-danger' },
  { color: 'bg-danger', text: 'text-danger' },
  { color: 'bg-warning', text: 'text-warning' },
  { color: 'bg-brand-600', text: 'text-brand-700' },
  { color: 'bg-success', text: 'text-success' },
]

export function PasswordStrength({ value }: { value: string }) {
  const { t } = useI18n()
  const score = passwordScore(value)
  const level = levels[score]!
  return (
    <div aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={cn('h-1.5 flex-1 rounded-full transition-colors', value && step <= score ? level.color : 'bg-ink-100')} />
        ))}
      </div>
      {value && <p className={cn('mt-1.5 text-sm font-medium', level.text)}>{t('pw.strength', { level: t(`pw.level.${score}` as TKey) })}</p>}
      <ul className="mt-2 grid grid-cols-1 gap-y-1 sm:grid-cols-2 sm:gap-x-3">
        {passwordRules.map((rule) => {
          const ok = rule.test(value)
          return (
            <li key={rule.label} className={cn('flex items-center gap-1.5 text-sm', ok ? 'text-success' : 'text-ink-500')}>
              <Check className={cn('size-3.5', !ok && 'opacity-30')} strokeWidth={2.25} aria-hidden />
              <span>
                {t(rule.label)}
                <span className="sr-only">{ok ? t('pw.met') : t('pw.unmet')}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
