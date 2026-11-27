import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { userName } from '@/features/employees/data'
import { roomText, type RcMessage } from './rc'

export const emojis = ['👍', '❤️', '😂', '🎉', '😮', '🙏', '👀', '✅']

const tokenPattern = /(`[^`]+`|\*\*[^*]+\*\*|_[^_\s][^_]*_|~[^~]+~|@\S+|https?:\/\/\S+|\/(?:requests|tasks|recruitment|payroll|employees|performance)\/[\w-]+)/g

export function renderText(text: string, me: number): ReactNode[] {
  return text.split(tokenPattern).map((part, index) => {
    if (!part) return null
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={index} className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[0.85em]" dir="ltr">{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) return <em key={index}>{part.slice(1, -1)}</em>
    if (part.startsWith('~') && part.endsWith('~') && part.length > 2) return <s key={index}>{part.slice(1, -1)}</s>
    if (part.startsWith('@')) {
      const self = userName(me).split(' ')[0] === part.slice(1) || part === '@all'
      return <span key={index} className={cn('rounded px-1 font-medium', self ? 'bg-accent-soft text-warning' : 'bg-brand-50 text-brand-700')}>{part}</span>
    }
    if (part.startsWith('http')) return <a key={index} href={part} target="_blank" rel="noreferrer" className="text-brand-700 underline" dir="ltr">{part}</a>
    if (part.startsWith('/')) return <Link key={index} to={part} className="text-brand-700 underline" dir="ltr">{part}</Link>
    return part
  })
}

export const messageText = (message: RcMessage) => (message.textL ? roomText(message.textL) : message.text)

