import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/cn'
import { roleLabels } from '@/lib/labels'
import { useI18n, type TKey } from '@/i18n'
import { setPreviewState, usePreviewState, type PreviewState } from '@/lib/preview-store'
import { useViewer } from '@/app/viewer-context'
import { Popover } from '@/components/ui'
import type { Role } from '@/types/entities'

const roles: Role[] = ['hr_admin', 'manager', 'employee']

const states: { value: PreviewState | null; label: TKey }[] = [
  { value: null, label: 'proto.normal' },
  { value: 'loading', label: 'proto.loading' },
  { value: 'empty', label: 'proto.empty' },
  { value: 'error', label: 'proto.error' },
]

function Group<T>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-500">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid grid-flow-col auto-cols-fr gap-1 rounded-control bg-ink-50 p-0.5">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-8 rounded-[6px] px-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              value === option.value ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PrototypeSwitcher({ className }: { className?: string }) {
  const { t } = useI18n()
  const { role, setRole } = useViewer()
  const state = usePreviewState()

  return (
    <Popover
      className="w-[min(92vw,340px)] p-4"
      trigger={({ toggle, open, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={t('proto.label')}
          className={cn(
            'flex h-10 items-center gap-2 rounded-xl border border-dashed border-accent bg-accent-soft px-3 text-sm text-ink-800 transition-[background-color,transform] duration-150 hover:bg-[#ffecc2] active:scale-95',
            className,
          )}
        >
          <FlaskConical className="size-4 text-warning" strokeWidth={1.75} />
          <span className="hidden whitespace-nowrap font-medium xl:inline">{roleLabels[role].label}</span>
          {state && <span className="size-1.5 rounded-full bg-warning" aria-hidden />}
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-4">
          <Group label={t('proto.role')} value={role} onChange={setRole} options={roles.map((value) => ({ value, label: roleLabels[value].label }))} />
          <Group label={t('proto.pageState')} value={state} onChange={setPreviewState} options={states.map((item) => ({ value: item.value, label: t(item.label) }))} />
        </div>
      )}
    </Popover>
  )
}
