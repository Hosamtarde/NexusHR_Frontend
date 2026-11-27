import { useMemo } from 'react'
import { Link } from 'react-router'
import { Bot, ChevronDown, Hash, Lock, MoreHorizontal, Star } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { IconButton, MenuItem, Popover } from '@/components/ui'
import { PersonCell } from '@/components/shared/Person'
import { markRead, hideRoom, lastActivity, mentions, roomName, toggleFavorite, toggleSection, unreadIn, useRc, type RcRoom } from './rc'
import { usePresenceOf } from './presence'
import { messageText } from './text'

const tints = ['bg-brand-600', 'bg-info', 'bg-success', 'bg-warning', 'bg-brand-800', 'bg-ink-700']

function tileLetter(name: string) {
  const base = name.replace(/^[#@\s]+/, '').replace(/^the\s+/i, '').replace(/^ال(?=\S)/, '').trim() || name
  const letters = [...base].filter((char) => /\p{L}/u.test(char))
  const pick = letters.find((char) => !/[اأإآٱ]/.test(char)) ?? letters[0] ?? ''
  return pick.toUpperCase()
}

const sizeClass = { extended: 'min-h-14 py-2', medium: 'min-h-10 py-1.5', condensed: 'min-h-8 py-1' }

function RoomAvatar({ room, name, size }: { room: RcRoom; name: string; size: string }) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  if (room.bot) return <span className={cn('grid shrink-0 place-items-center rounded-control bg-brand-600 text-white', size)}><Bot className="size-1/2" strokeWidth={1.75} aria-hidden /></span>
  return <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-control text-sm font-semibold text-white', size, tints[hash % tints.length])}>{tileLetter(name)}</span>
}

interface RoomListProps {
  activeId: string | undefined
  nexaUnread: number
  nexaLast: string
}

export function RoomList({ activeId, nexaUnread, nexaLast }: RoomListProps) {
  const { t } = useI18n()
  const { userId } = useViewer()
  const presenceOf = usePresenceOf()
  const rooms = useRc((state) => state.rooms)
  const messages = useRc((state) => state.messages)
  const lastRead = useRc((state) => state.lastRead)
  const display = useRc((state) => state.display)
  const hidden = useRc((state) => state.hidden[userId]) ?? []
  const collapsed = useRc((state) => state.collapsed)
  const favorites = useRc((state) => state.favorites[userId]) ?? []

  const mine = useMemo(() => {
    const own = rooms.filter((room) => room.members.includes(userId))
    return [{ id: `nexa-${userId}`, t: 'd', name: { ar: 'نيكسا', en: 'Nexa' }, topic: '', members: [userId], ownerId: null, readOnly: false, bot: true } as RcRoom, ...own]
  }, [rooms, userId])

  const unreadOf = (room: RcRoom) => (room.bot ? nexaUnread : unreadIn(messages, lastRead, room.id, userId).length)
  const stamp = (room: RcRoom) => (room.bot ? nexaLast : lastActivity(messages, room.id))
  const sorted = mine
    .filter((room) => !hidden.includes(room.id) || room.id === activeId)
    .sort((a, b) => (display.sort === 'name' ? roomName(a, userId).localeCompare(roomName(b, userId)) : stamp(b).localeCompare(stamp(a))))

  const taken = new Set<string>()
  const take = (list: RcRoom[]) => list.filter((room) => !taken.has(room.id)).map((room) => (taken.add(room.id), room))
  const groups: { key: string; title: string | null; rooms: RcRoom[] }[] = []
  if (display.groupUnread) groups.push({ key: 'unread', title: t('rc.group.unread'), rooms: take(sorted.filter((room) => unreadOf(room) > 0)) })
  if (display.groupFavorites) groups.push({ key: 'favorites', title: t('rc.favorites'), rooms: take(sorted.filter((room) => favorites.includes(room.id))) })
  if (display.groupTypes) {
    groups.push({ key: 'discussions', title: t('rc.discussions'), rooms: take(sorted.filter((room) => room.parentId)) })
    groups.push({ key: 'channels', title: t('rc.channels'), rooms: take(sorted.filter((room) => room.t === 'c')) })
    groups.push({ key: 'directs', title: t('rc.directs'), rooms: take(sorted.filter((room) => room.t === 'd')) })
  } else groups.push({ key: 'all', title: null, rooms: take(sorted) })

  const row = (room: RcRoom) => {
    const name = roomName(room, userId)
    const unread = unreadOf(room)
    const unreadList = room.bot ? [] : unreadIn(messages, lastRead, room.id, userId)
    const mention = unreadList.some((m) => mentions(messageText(m), userId))
    const active = activeId === room.id
    const favorite = favorites.includes(room.id)
    const avatarSize = display.density === 'extended' ? 'size-10' : display.density === 'medium' ? 'size-7' : 'size-6'
    const other = room.t === 'd' && !room.bot ? room.members.find((id) => id !== userId) : undefined
    const last = [...messages].reverse().find((m) => m.rid === room.id && !m.system)
    return (
      <li key={room.id} className="group relative">
        <Link
          to={`/messages/${room.id}`}
          aria-current={active ? 'page' : undefined}
          className={cn('relative flex items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors', sizeClass[display.density], active ? 'bg-brand-100 font-medium text-brand-900 before:absolute before:inset-y-1 before:start-0 before:w-[3px] before:rounded-full before:bg-brand-600' : 'text-ink-700 hover:bg-white/80', unread > 0 && !active && 'font-semibold text-ink-900')}
        >
          {display.avatars && (other !== undefined ? <PersonCell userId={other} avatarOnly card={false} size={display.density === 'extended' ? 'md' : 'sm'} presence={presenceOf(other)} /> : <RoomAvatar room={room} name={name} size={avatarSize} />)}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1">
              {room.t === 'c' && (room.readOnly ? <Lock className="size-3.5 shrink-0 text-ink-500" strokeWidth={1.75} aria-hidden /> : <Hash className="size-3.5 shrink-0 text-ink-500" strokeWidth={1.75} aria-hidden />)}
              <span className="truncate">{name}</span>
              {favorite && <Star className="size-3 shrink-0 fill-accent text-accent" strokeWidth={1.75} aria-hidden />}
            </span>
            {display.density === 'extended' && last && <span className="block truncate text-xs font-normal text-ink-500">{messageText(last) || last.attachment?.name}</span>}
          </span>
          {unread > 0 && <span className={cn('tabular grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold group-focus-within:hidden group-hover:hidden', mention ? 'bg-accent text-side-950' : 'bg-brand-600 text-white')}>{unread}</span>}
        </Link>
        <div className="absolute end-1 top-1/2 hidden -translate-y-1/2 group-focus-within:block group-hover:block">
          <Popover align="end" className="p-1.5" minWidth={176} trigger={({ toggle, open, id }) => <IconButton icon={MoreHorizontal} size="sm" label={t('k.more')} onClick={toggle} aria-expanded={open} aria-controls={id} />}>
            {(close) => (
              <div role="menu">
                {!room.bot && <MenuItem icon={Star} onSelect={() => { toggleFavorite(room.id, userId); close() }}>{favorite ? t('rc.unfavorite') : t('rc.favorite')}</MenuItem>}
                {!room.bot && <MenuItem onSelect={() => { hideRoom(room.id, userId); close() }}>{t('rc.hide')}</MenuItem>}
                {!room.bot && <MenuItem onSelect={() => { markRead(room.id, userId); close() }}>{t('rc.markRead')}</MenuItem>}
              </div>
            )}
          </Popover>
        </div>
      </li>
    )
  }

  return (
    <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-2" aria-label={t('rc.sidebar')}>
      {groups.map((group) => {
        if (group.rooms.length === 0) return null
        const closed = group.title !== null && collapsed[group.key]
        return (
          <section key={group.key} aria-label={group.title ?? t('rc.sidebar')} className="mb-1">
            {group.title !== null && (
              <button type="button" onClick={() => toggleSection(group.key)} aria-expanded={!closed} className="flex w-full items-center gap-1.5 rounded-control px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50">
                <ChevronDown className={cn('size-3.5 transition-transform', closed && '-rotate-90 rtl:rotate-90')} strokeWidth={2} aria-hidden />
                {group.title}
              </button>
            )}
            {!closed && <ul className="flex flex-col gap-0.5">{group.rooms.map(row)}</ul>}
          </section>
        )
      })}
    </nav>
  )
}
