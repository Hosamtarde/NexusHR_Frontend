import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import { Floating } from './floating'
import { Input } from './Field'

interface SuggestInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  otherLabel: string
  placeholder?: string
  maxLength?: number
  invalid?: boolean
  hint?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export function SuggestInput({ id, value, onChange, suggestions, otherLabel, placeholder, maxLength, invalid, hint, ...aria }: SuggestInputProps) {
  const listId = useId()
  const wrapper = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const needle = value.trim().toLowerCase()
  const matches = suggestions.filter((item) => item.toLowerCase().includes(needle) && item.toLowerCase() !== needle)
  const total = matches.length + 1

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const pick = (index: number) => {
    if (index < matches.length) onChange(matches[index]!.slice(0, maxLength))
    close()
    field.current?.focus()
  }

  const keys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((current) => (current + 1) % total)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActive((current) => (current <= 0 ? total - 1 : current - 1))
    } else if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault()
      pick(active)
    } else if (event.key === 'Tab') {
      close()
    }
  }

  return (
    <div>
      {hint && <p className="mb-1.5 text-sm text-ink-500">{hint}</p>}
      <div ref={wrapper}>
        <Input
          ref={field}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          maxLength={maxLength}
          placeholder={placeholder}
          invalid={invalid}
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={keys}
          {...aria}
        />
      </div>
      <Floating open={open} anchorRef={wrapper} onClose={close} matchWidth minWidth={160} id={listId} role="listbox" focusFirst={false} className="p-1">
        {[...matches, otherLabel].map((label, index) => (
          <div
            key={label}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={active === index}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => pick(index)}
            onMouseEnter={() => setActive(index)}
            className={cn('cursor-pointer rounded-control px-2.5 py-2 text-start text-base', index === matches.length && 'mt-1 border-t border-ink-100 text-ink-600', active === index ? 'bg-ink-50' : '')}
          >
            {label}
          </div>
        ))}
      </Floating>
    </div>
  )
}
