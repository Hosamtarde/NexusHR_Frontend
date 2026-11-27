import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Bold, Code, Italic, Link2, MessagesSquare, Paperclip, Plus, SendHorizontal, Smile, Strikethrough, Upload, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { IconButton, MenuItem, Popover } from '@/components/ui'
import { userName } from '@/features/employees/data'
import { slashCommands } from './commands'
import { emojis, messageText } from './text'
import type { RcAttachment, RcMessage } from './rc'

export interface SendPayload {
  text: string
  attachment?: RcAttachment
}

interface ComposerProps {
  placeholder: string
  quote: RcMessage | null
  editing: RcMessage | null
  onClearQuote: () => void
  onCancelEdit: () => void
  onSend: (payload: SendPayload) => void
  onCommand: (name: string, args: string) => string | null
  onTyping: () => void
  onDiscussion: () => void
}

export function Composer({ placeholder, quote, editing, onClearQuote, onCancelEdit, onSend, onCommand, onTyping, onDiscussion }: ComposerProps) {
  const { t } = useI18n()
  const [text, setText] = useState(editing ? messageText(editing) : '')
  const area = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const slash = text.startsWith('/') && !text.includes(' ')
  const options = slash ? slashCommands.filter((command) => command.name.startsWith(text.slice(1).toLowerCase())) : []

  const insert = (before: string, after = before) => {
    const node = area.current
    if (!node) return
    const { selectionStart: start, selectionEnd: end } = node
    const selected = text.slice(start, end)
    const next = `${text.slice(0, start)}${before}${selected}${after}${text.slice(end)}`
    setText(next)
    window.requestAnimationFrame(() => {
      node.focus()
      node.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  const submit = () => {
    const value = text.trim()
    if (!value) return
    if (value.startsWith('/')) {
      const [command, ...rest] = value.slice(1).split(' ')
      if (slashCommands.some((entry) => entry.name === command)) {
        const result = onCommand(command ?? '', rest.join(' ').trim())
        setText('')
        if (result) onSend({ text: result })
        return
      }
    }
    onSend({ text: value })
    setText('')
  }

  const key = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (slash && options.length === 1 && text.slice(1) !== options[0]!.name) {
        setText(`/${options[0]!.name} `)
        return
      }
      submit()
    }
    if (event.key === 'Escape' && editing) onCancelEdit()
  }

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0]
    if (!chosen) return
    const image = chosen.type.startsWith('image/')
    onSend({ text: '', attachment: { name: chosen.name, size: chosen.size, image, url: image ? URL.createObjectURL(chosen) : undefined } })
    event.target.value = ''
  }

  return (
    <div className="relative border-t border-ink-300 bg-ink-25 px-4 pb-4 pt-3">
      {options.length > 0 && (
        <ul role="listbox" aria-label={t('rc.cmd.title')} className="absolute inset-x-4 bottom-full mb-1 overflow-hidden rounded-surface border border-ink-200 bg-white p-1 shadow-md">
          {options.map((command) => (
            <li key={command.name}>
              <button type="button" role="option" aria-selected={false} onClick={() => { setText(`/${command.name} `); area.current?.focus() }} className="flex w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-start text-sm hover:bg-ink-50">
                <span className="font-mono font-medium text-ink-900" dir="ltr">/{command.name}</span>
                <span className="truncate text-ink-500">{t(command.hint)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {(quote || editing) && (
        <div className="mb-2 flex items-start justify-between gap-3 rounded-control border-s-4 border-brand-300 bg-ink-50 px-3 py-2 text-sm text-ink-600">
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-ink-700">{editing ? t('rc.editing') : userName(quote!.uid)}</span>
            <span className="line-clamp-2">{messageText(editing ?? quote!)}</span>
          </span>
          <IconButton icon={X} size="sm" label={t('act.cancel')} onClick={editing ? onCancelEdit : onClearQuote} />
        </div>
      )}
      <div className="rounded-surface border border-ink-300 bg-white shadow-card transition-shadow focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-200">
        <textarea
          ref={area}
          rows={1}
          value={text}
          autoFocus={Boolean(editing)}
          onChange={(event) => {
            setText(event.target.value)
            onTyping()
          }}
          onKeyDown={key}
          placeholder={placeholder}
          aria-label={placeholder}
          className="block max-h-40 min-h-11 w-full resize-none rounded-surface bg-transparent px-3 py-2.5 text-base text-ink-900 outline-none placeholder:text-ink-400"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <Popover align="start" minWidth={176} placement="top" className="p-1.5" trigger={({ toggle, open, id }) => <IconButton icon={Plus} size="sm" label={t('rc.moreActions')} onClick={toggle} aria-expanded={open} aria-controls={id} />}>
              {(close) => (
                <div role="menu">
                  <MenuItem icon={Upload} onSelect={() => { close(); file.current?.click() }}>{t('rc.uploadFile')}</MenuItem>
                  <MenuItem icon={MessagesSquare} onSelect={() => { close(); onDiscussion() }}>{t('rc.create.discussion')}</MenuItem>
                </div>
              )}
            </Popover>
            <Popover align="start" minWidth={0} placement="top" className="p-1.5" trigger={({ toggle, open, id }) => <IconButton icon={Smile} size="sm" label={t('rc.emoji')} onClick={toggle} aria-expanded={open} aria-controls={id} />}>
              {(close) => (
                <div className="grid grid-cols-4 gap-1" role="menu">
                  {emojis.map((emoji) => (
                    <button key={emoji} type="button" role="menuitem" onClick={() => { setText((value) => `${value}${emoji}`); close(); area.current?.focus() }} className="grid size-9 place-items-center rounded-control text-xl hover:bg-ink-50">{emoji}</button>
                  ))}
                </div>
              )}
            </Popover>
            <IconButton icon={Paperclip} size="sm" label={t('rc.attach')} onClick={() => file.current?.click()} />
            <input ref={file} type="file" className="hidden" onChange={pick} />
            <span className="mx-1 h-4 w-px bg-ink-200" aria-hidden />
            <IconButton icon={Bold} size="sm" label={t('rc.bold')} onClick={() => insert('**')} />
            <IconButton icon={Italic} size="sm" label={t('rc.italic')} onClick={() => insert('_')} />
            <IconButton icon={Strikethrough} size="sm" label={t('rc.strike')} onClick={() => insert('~')} />
            <IconButton icon={Code} size="sm" label={t('rc.code')} onClick={() => insert('`')} />
            <IconButton icon={Link2} size="sm" label={t('rc.link')} onClick={() => insert('[', '](https://)')} />
          </div>
          <IconButton icon={SendHorizontal} size="sm" label={t('rc.send')} onClick={submit} disabled={!text.trim()} className={cn(text.trim() && 'text-brand-700')} />
        </div>
      </div>
    </div>
  )
}
