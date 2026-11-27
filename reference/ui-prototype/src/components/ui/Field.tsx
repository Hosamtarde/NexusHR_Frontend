import {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { Floating } from './floating'

const controlBase =
  'w-full rounded-control border bg-white text-base text-ink-900 shadow-sm transition-colors placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500'

function controlClasses(invalid?: boolean, className?: string) {
  return cn(
    controlBase,
    invalid ? 'border-danger focus:border-danger focus:ring-danger-bg' : 'border-ink-200',
    className,
  )
}

interface FieldProps {
  label?: string
  hint?: ReactNode
  error?: string
  required?: boolean
  optional?: boolean
  className?: string
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>
}

export function Field({ label, hint, error, required, optional, className, children }: FieldProps) {
  const { t } = useI18n()
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const control = isValidElement(children)
    ? cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })
    : children
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="flex items-center gap-1 text-sm font-medium text-ink-800">
          {label}
          {required && <span className="text-danger" aria-hidden>*</span>}
          {optional && <span className="font-normal text-ink-500">{t('act.optional')}</span>}
        </label>
      )}
      {control}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leading, trailing, className, ...rest },
  ref,
) {
  const isInvalid = invalid || rest['aria-invalid'] === true
  if (!leading && !trailing) {
    return <input ref={ref} className={controlClasses(isInvalid, cn('h-10 px-3', className))} {...rest} />
  }
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-ink-400">{leading}</span>
      )}
      <input
        ref={ref}
        className={controlClasses(isInvalid, cn('h-10', leading ? 'ps-9' : 'ps-3', trailing ? 'pe-10' : 'pe-3', className))}
        {...rest}
      />
      {trailing && <span className="absolute inset-y-0 end-0 flex items-center pe-1.5">{trailing}</span>}
    </div>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 4, ...rest },
  ref,
) {
  const isInvalid = invalid || rest['aria-invalid'] === true
  return <textarea ref={ref} rows={rows} className={controlClasses(isInvalid, cn('resize-y px-3 py-2', className))} {...rest} />
})

interface SelectProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  invalid?: boolean
  placeholder?: string
  value?: string | number
  onChange?: (event: { target: { value: string } }) => void
  options: { value: string | number; label: string }[]
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { invalid, className, options, placeholder, value = '', onChange, disabled, ...rest },
  forwarded,
) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const id = useId()
  const close = useCallback(() => setOpen(false), [])
  const isInvalid = invalid || rest['aria-invalid'] === true
  const all = placeholder !== undefined ? [{ value: '', label: placeholder }, ...options] : options
  const current = all.find((option) => String(option.value) === String(value))
  const pick = (next: string | number) => {
    onChange?.({ target: { value: String(next) } })
    setOpen(false)
    wrapper.current?.querySelector('button')?.focus()
  }
  return (
    <div ref={wrapper} className='relative'>
      <button
        ref={forwarded}
        type='button'
        role='combobox'
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className={controlClasses(isInvalid, cn('flex h-10 items-center justify-between gap-2 ps-3 pe-9 text-start', !current || current.value === '' ? 'text-ink-500' : '', className))}
        {...rest}
      >
        <span className='truncate'>{current?.label ?? placeholder ?? ''}</span>
      </button>
      <ChevronDown className={cn('pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-ink-500 transition-transform', open && 'rotate-180')} strokeWidth={1.75} aria-hidden />
      <Floating open={open} anchorRef={wrapper} onClose={close} matchWidth minWidth={160} id={id} role='listbox' className='p-1'>
        {all.map((option) => {
          const selected = String(option.value) === String(value)
          return (
            <button
              key={option.value}
              type='button'
              role='option'
              aria-selected={selected}
              tabIndex={-1}
              onClick={() => pick(option.value)}
              className={cn('flex w-full items-center justify-between gap-3 rounded-control px-2.5 py-2 text-start text-base whitespace-nowrap transition-colors hover:bg-ink-50 focus:bg-ink-50 focus:outline-none', selected ? 'font-medium text-brand-700' : 'text-ink-800')}
            >
              {option.label}
              {selected && <Check className='size-4 shrink-0' strokeWidth={2} aria-hidden />}
            </button>
          )
        })}
      </Floating>
    </div>
  )
})

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: ReactNode
}

export function Checkbox({ label, description, className, ...rest }: CheckboxProps) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-[4px] border-ink-300 accent-brand-600"
        {...rest}
      />
      <span className="flex flex-col">
        <span className="text-base text-ink-800">{label}</span>
        {description && <span className="text-sm text-ink-500">{description}</span>}
      </span>
    </label>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex flex-col">
        <span className="text-base font-medium text-ink-800">{label}</span>
        {description && <span className="text-sm text-ink-500">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-brand-600' : 'bg-ink-300',
        )}
      >
        <span
          className={cn(
            'inline-block size-[18px] rounded-full bg-white shadow-sm transition-transform',
            checked ? 'ltr:translate-x-[19px] rtl:-translate-x-[19px]' : 'ltr:translate-x-[3px] rtl:-translate-x-[3px]',
          )}
        />
      </button>
    </div>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label: string
  size?: 'sm' | 'md'
}

export function Segmented<T extends string>({ value, onChange, options, label, size = 'md' }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-control border border-ink-200 bg-ink-50 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-[5px] font-medium transition-colors',
            size === 'sm' ? 'h-7 px-2.5 text-sm' : 'h-8 px-3 text-base',
            value === option.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
