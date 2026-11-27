import { useState } from 'react'
import { Link } from 'react-router'
import { Check, FileText, Forward, Link2, MessageSquareReply, MoreHorizontal, Pencil, Pin, Quote, SmilePlus, Star, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { formatDateTime, formatTime } from '@/lib/format'
import { IconButton, MenuItem, Popover, useToast } from '@/components/ui'
import { PersonAvatar, PersonCell, PersonHover } from '@/components/shared/Person'
import { getUser, userName } from '@/features/employees/data'
import { NEXA } from '@/features/messages/data'
import type { RcMessage } from './rc'
import { emojis, messageText, renderText } from './text'

const sizeText = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

interface MessageRowProps {
  message: RcMessage
  quoted?: RcMessage
  replies: number
  compact: boolean
  canModerate: boolean
  roomId: string
  inThread?: boolean
  onReply: (message: RcMessage) => void
  onQuote: (message: RcMessage) => void
  onEdit: (message: RcMessage) => void
  onDelete: (message: RcMessage) => void
  onReact: (message: RcMessage, emoji: string) => void
  onPin: (message: RcMessage) => void
  onStar: (message: RcMessage) => void
  onForward: (message: RcMessage) => void
  ownerId: number | null
  link?: string
}

export function MessageRow({ message, quoted, replies, compact, canModerate, roomId, inThread, onReply, onQuote, onEdit, onDelete, onReact, onPin, onStar, onForward, ownerId, link }: MessageRowProps) {
  const { t } = useI18n()
  const toast = useToast()
  const { userId } = useViewer()
  const [copied, setCopied] = useState(false)
  const sender = message.uid === NEXA ? null : getUser(message.uid)
  const name = message.uid === NEXA ? 'Nexa' : userName(message.uid)
  const mine = message.uid === userId
  const starred = message.starred.includes(userId)
  const copy = () => {
    void navigator.clipboard?.writeText(`${window.location.origin}/messages/${roomId}?msg=${message.id}`)
    setCopied(true)
    toast.success(t('rc.linkCopied'))
    window.setTimeout(() => setCopied(false), 1500)
  }
  if (message.system) {
    return (
      <li id={`msg-${message.id}`} className="flex items-center gap-2 px-5 py-1 text-xs text-ink-500">
        <span className="w-9 shrink-0" />
        {sender && <PersonCell userId={sender.user_id} avatarOnly size="xs" />}
        <span>{name} {t('rc.joined')}</span>
        <span className="tabular">{formatTime(message.ts)}</span>
      </li>
    )
  }
  return (
    <li id={`msg-${message.id}`} className={cn('group relative flex gap-3 px-5 py-1 hover:bg-ink-25', message.pinned && 'bg-accent-soft/30', !compact && 'pt-3')}>
      <div className="w-9 shrink-0">{compact ? <span className="tabular hidden pt-1 text-[10px] text-ink-400 group-hover:block">{formatTime(message.ts)}</span> : sender ? <PersonCell userId={sender.user_id} avatarOnly size="md" /> : <PersonAvatar src={null} size="md" />}</div>
      <div className="min-w-0 flex-1">
        {!compact && (
          <p className="flex items-baseline gap-2">
            {sender ? <PersonHover userId={sender.user_id} className="text-sm font-semibold text-ink-900 hover:underline">{name}</PersonHover> : <span className="text-sm font-semibold text-ink-900">{name}</span>}
            {message.uid === NEXA && <span className="rounded bg-brand-50 px-1.5 text-[10px] font-semibold text-brand-700">BOT</span>}
            {sender?.role === 'hr_admin' && <span className="rounded bg-ink-100 px-1.5 text-[10px] font-semibold text-ink-700">{t('rc.admin')}</span>}
            {ownerId === message.uid && sender?.role !== 'hr_admin' && <span className="rounded bg-ink-100 px-1.5 text-[10px] font-semibold text-ink-700">{t('rc.owner')}</span>}
            <span className="text-xs text-ink-500" title={formatDateTime(message.ts)}>{formatTime(message.ts)}</span>
          </p>
        )}
        {quoted && (
          <div className="mb-1 mt-0.5 rounded-control border-s-4 border-brand-300 bg-ink-50 px-3 py-1.5 text-sm text-ink-600">
            <p className="text-xs font-semibold text-ink-700">{quoted.uid === NEXA ? 'Nexa' : userName(quoted.uid)}</p>
            <p className="line-clamp-2">{messageText(quoted) || quoted.attachment?.name}</p>
          </div>
        )}
        {messageText(message) && <p className="whitespace-pre-wrap break-words text-base text-ink-800">{renderText(messageText(message), userId)}{message.edited && <span className="ms-2 text-xs text-ink-400">({t('rc.edited')})</span>}</p>}
        {message.attachment && (
          message.attachment.image && message.attachment.url ? (
            <a href={message.attachment.url} target="_blank" rel="noreferrer" className="mt-1 block w-fit overflow-hidden rounded-xl border border-ink-200">
              <img src={message.attachment.url} alt={message.attachment.name} className="max-h-56 max-w-full object-cover" />
            </a>
          ) : (
            <div className="mt-1 flex w-fit max-w-sm items-center gap-3 rounded-xl border border-ink-200 bg-white px-3 py-2">
              <FileText className="size-6 shrink-0 text-brand-600" strokeWidth={1.5} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink-900" dir="ltr">{message.attachment.name}</span>
                <span className="text-xs text-ink-500">{sizeText(message.attachment.size)}</span>
              </span>
            </div>
          )
        )}
        {link && <Link to={link} className="mt-1 inline-flex rounded-control border border-ink-200 px-2.5 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50">{t('rc.openLink')}</Link>}
        {Object.keys(message.reactions).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Object.entries(message.reactions).map(([emoji, ids]) => (
              <button key={emoji} type="button" onClick={() => onReact(message, emoji)} title={ids.map((id) => userName(id)).join(', ')} aria-pressed={ids.includes(userId)} className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm', ids.includes(userId) ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50')}>
                <span>{emoji}</span>
                <span className="tabular text-xs font-medium">{ids.length}</span>
              </button>
            ))}
          </div>
        )}
        {!inThread && replies > 0 && (
          <button type="button" onClick={() => onReply(message)} className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
            <MessageSquareReply className="size-4" strokeWidth={1.75} />
            {t('rc.replies', { n: replies })}
          </button>
        )}
        {(message.pinned || starred) && (
          <p className="mt-1 flex items-center gap-2 text-xs text-ink-500">
            {message.pinned && <span className="flex items-center gap-1"><Pin className="size-3" strokeWidth={2} />{t('rc.pinned')}</span>}
            {starred && <span className="flex items-center gap-1"><Star className="size-3 fill-accent text-accent" strokeWidth={2} />{t('rc.starred')}</span>}
          </p>
        )}
      </div>
      <div className="absolute -top-4 end-5 z-10 hidden items-center gap-0.5 rounded-control border border-ink-200 bg-white p-0.5 shadow-md group-focus-within:flex group-hover:flex">
        <Popover
          align="end"
          minWidth={0}
          className="p-1.5"
          trigger={({ toggle, open, id }) => <IconButton icon={SmilePlus} size="sm" label={t('rc.react')} onClick={toggle} aria-expanded={open} aria-controls={id} />}
        >
          {(close) => (
            <div className="grid grid-cols-4 gap-1" role="menu">
              {emojis.map((emoji) => (
                <button key={emoji} type="button" role="menuitem" onClick={() => { onReact(message, emoji); close() }} className="grid size-9 place-items-center rounded-control text-xl hover:bg-ink-50">{emoji}</button>
              ))}
            </div>
          )}
        </Popover>
        <IconButton icon={Quote} size="sm" label={t('rc.quote')} onClick={() => onQuote(message)} />
        {!inThread && <IconButton icon={MessageSquareReply} size="sm" label={t('rc.replyThread')} onClick={() => onReply(message)} />}
        <IconButton icon={Forward} size="sm" label={t('rc.forwardMessage')} onClick={() => onForward(message)} />
        <Popover
          align="end"
          className="p-1.5"
          minWidth={176}
          trigger={({ toggle, open, id }) => <IconButton icon={MoreHorizontal} size="sm" label={t('k.more')} onClick={toggle} aria-expanded={open} aria-controls={id} />}
        >
          {(close) => (
            <div role="menu">
              {mine && !message.attachment && <MenuItem icon={Pencil} onSelect={() => { onEdit(message); close() }}>{t('rc.edit')}</MenuItem>}
              {(mine || canModerate) && <MenuItem icon={Trash2} tone="danger" onSelect={() => { onDelete(message); close() }}>{t('rc.delete')}</MenuItem>}
              {canModerate && <MenuItem icon={Pin} onSelect={() => { onPin(message); close() }}>{message.pinned ? t('rc.unpin') : t('rc.pin')}</MenuItem>}
              <MenuItem icon={Star} onSelect={() => { onStar(message); close() }}>{starred ? t('rc.unstar') : t('rc.star')}</MenuItem>
              <MenuItem icon={copied ? Check : Link2} onSelect={() => { copy(); close() }}>{t('rc.copyLink')}</MenuItem>
            </div>
          )}
        </Popover>
      </div>
    </li>
  )
}
