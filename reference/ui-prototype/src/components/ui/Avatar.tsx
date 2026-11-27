import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { getDefaultAvatar, type DefaultAvatar } from '@/lib/avatar'

const sizes = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
}

interface AvatarProps {
  src?: string | null
  firstName?: string | null
  size?: keyof typeof sizes
  className?: string
}

const silhouettes: Record<DefaultAvatar, ReactNode> = {
  male: (
    <>
      <path d="M2.5 40c0-9.8 7-14.5 17.5-14.5S37.5 30.2 37.5 40z" fill="currentColor" />
      <rect x="16.5" y="19" width="7" height="8" rx="2" fill="currentColor" />
      <circle cx="20" cy="14" r="7" fill="currentColor" />
      <path d="M12.8 13.5C12.3 8 15.5 5 20 5s7.7 3 7.2 8.5c-1.3-2.4-3.9-3.6-7.2-3.6s-5.9 1.2-7.2 3.6z" fill="currentColor" className="text-ink-600" />
    </>
  ),
  female: (
    <>
      <path d="M9.5 17C9.5 9.5 14 5 20 5s10.5 4.5 10.5 12v13.5c0 1.4-1.1 2.5-2.5 2.5H12c-1.4 0-2.5-1.1-2.5-2.5z" fill="currentColor" className="text-ink-600" />
      <path d="M9.5 40c0-7.6 4.8-11.5 10.5-11.5S30.5 32.4 30.5 40z" fill="currentColor" />
      <circle cx="20" cy="16.5" r="6" fill="currentColor" />
      <path d="M13.8 15.5C14.5 11.5 17 9.5 20 9.5s5.5 2 6.2 6c-2-1.8-4-2.7-6.2-2.7s-4.2.9-6.2 2.7z" fill="currentColor" className="text-ink-600" />
    </>
  ),
  neutral: (
    <>
      <circle cx="20" cy="15" r="7" fill="currentColor" />
      <path d="M6 40c0-8.4 6.3-13.5 14-13.5S34 31.6 34 40z" fill="currentColor" />
    </>
  ),
}

export function Avatar({ src, firstName, size = 'sm', className }: AvatarProps) {
  if (src) {
    return <img src={src} alt="" className={cn('shrink-0 rounded-full object-cover ring-2 ring-white', sizes[size], className)} />
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('shrink-0 rounded-full bg-ink-100 text-ink-400 ring-2 ring-white', sizes[size], className)}>
      {silhouettes[getDefaultAvatar(firstName)]}
    </svg>
  )
}
