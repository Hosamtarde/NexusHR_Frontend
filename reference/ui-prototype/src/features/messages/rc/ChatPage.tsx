import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowDown, AtSign, Bot, ChevronLeft, Compass, FileText, Hash, Info, Lock, MessageSquarePlus, MessageSquareReply, MessagesSquare, MoreHorizontal, Pin, Plus, Search, Star, Users, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { LogoMark } from '@/components/layout/Logo'
import { useI18n } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { formatDate, formatTime } from '@/lib/format'
import { Button, EmptyState, Skeleton, IconButton, Input, MenuItem, Modal, Popover, SearchInput, Segmented, Select, useToast } from '@/components/ui'
import { PersonCell, PersonHover, PersonStack } from '@/components/shared/Person'
import { useStore, markAllRead } from '@/store'
import { renderNotification } from '@/features/notifications/render'
import { answerFor } from '@/features/messages/nexa'
import { NEXA } from '@/features/messages/data'
import { userName } from '@/features/employees/data'
import { Composer, type SendPayload } from './Composer'
import { CreateModal, type CreateKind } from './Create'
import { RoomList } from './RoomList'
import { MessagesToolbar } from './Toolbar'
import { reconnectChat, retryChat, useChatState } from './connection'
import { usePresenceOf } from './presence'
import { MessageRow } from './MessageRow'
import { messageText } from './text'
import {
  addMembers,
  allUsersExcept,
  botRoom,
  deleteMessage,
  editMessage,
  isMember,
  joinRoom,
  leaveRoom,
  removeMember,
  markRead,
  mentions,
  nexaRoomId,
  openDirect,
  roomName,
  roomText,
  sendMessage,
  setTopic,
  setTyping,
  toggleFavorite,
  togglePin,
  toggleReaction,
  toggleStar,
  useRc,
  type RcMessage,
  type RcRoom,
} from './rc'

type PanelMode = 'members' | 'mentions' | 'search' | 'threads' | 'discussions' | 'info' | 'pinned' | 'files' | 'thread' | null

function useRooms() {
  const { userId } = useViewer()
  const rooms = useRc((state) => state.rooms)
  return useMemo(() => [botRoom(userId), ...rooms.filter((room) => room.members.includes(userId))], [rooms, userId])
}

function useNexaFeed(): { messages: RcMessage[]; links: Record<number, string>; unread: number } {
  const { userId } = useViewer()
  const notifications = useStore((state) => state.notifications)
  const stored = useRc((state) => state.messages)
  return useMemo(() => {
    const mine = notifications.filter((item) => item.user_id === userId)
    const links: Record<number, string> = {}
    const fromNotifications: RcMessage[] = mine.map((item) => {
      const id = -item.notification_id
      if (item.link) links[id] = item.link
      const view = renderNotification(item)
      return { id, rid: nexaRoomId(userId), uid: NEXA, text: `**${view.title}**\n${view.message}`, ts: item.created_at, reactions: {}, starred: [] }
    })
    const chat = stored.filter((m) => m.rid === nexaRoomId(userId))
    return { messages: [...fromNotifications, ...chat].sort((a, b) => a.ts.localeCompare(b.ts)), links, unread: mine.filter((item) => !item.is_read).length }
  }, [notifications, stored, userId])
}

function RoomIcon({ room, className }: { room: RcRoom; className?: string }) {
  if (room.bot) return <Bot className={className} strokeWidth={1.75} aria-hidden />
  if (room.t === 'd') return <AtSign className={className} strokeWidth={1.75} aria-hidden />
  return room.readOnly ? <Lock className={className} strokeWidth={1.75} aria-hidden /> : <Hash className={className} strokeWidth={1.75} aria-hidden />
}

function HomeView({ onCreate }: { onCreate: (kind: CreateKind) => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const cards = [
    { icon: Hash, title: t('rc.home.createChannels'), desc: t('rc.home.createChannelsDesc'), run: () => onCreate('channel') },
    { icon: Compass, title: t('rc.home.joinRooms'), desc: t('rc.home.joinRoomsDesc'), run: () => navigate('/messages/directory') },
  ]
  return (
    <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-gradient-to-b from-brand-600/[0.07] via-brand-600/[0.02] to-white px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-[960px]">
        <header className="flex items-center gap-4 border-b border-ink-200/80 pb-6">
          <LogoMark className="size-14" />
          <div className="min-w-0">
            <p className="text-2xl leading-tight font-bold tracking-tight text-ink-900">{t('rc.home.workspace')}</p>
            <p className="mt-1 text-base text-ink-600">{t('rc.home.tagline')}</p>
          </div>
        </header>
        <p className="mt-8 text-sm font-medium text-ink-500">{t('rc.home.small')}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900">{t('rc.home.welcome')}</h1>
        <p className="mt-8 text-lg font-medium text-ink-700">{t('rc.home.ideas')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <button key={card.title} type="button" onClick={card.run} className="min-h-40 rounded-surface border border-ink-200 bg-white p-6 text-start transition-colors hover:border-brand-300 hover:bg-brand-50/40">
              <card.icon className="size-9 text-brand-600" strokeWidth={1.5} aria-hidden />
              <p className="mt-4 text-lg font-semibold text-ink-900">{card.title}</p>
              <p className="mt-1.5 text-sm text-ink-600">{card.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function DirectoryView() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { userId } = useViewer()
  const rooms = useRc((state) => state.rooms)
  const [tab, setTab] = useState<'channels' | 'users'>('channels')
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const channels = rooms.filter((room) => room.t === 'c' && roomName(room, userId).toLowerCase().includes(needle))
  const people = allUsersExcept(userId).filter((user) => `${user.first_name} ${user.last_name}`.toLowerCase().includes(needle))
  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-xl font-semibold text-ink-900">{t('rc.directory')}</h1>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Segmented label={t('rc.directory')} value={tab} onChange={setTab} options={[{ value: 'channels', label: t('rc.channels') }, { value: 'users', label: t('rc.users') }]} />
          <SearchInput value={q} onChange={setQ} placeholder={tab === 'channels' ? t('rc.searchRooms') : t('rc.searchPeople')} className="min-w-0 flex-1" />
        </div>
        {tab === 'channels' ? (
          channels.length === 0 ? <EmptyState compact icon={Hash} title={t('k.noResults')} /> : (
            <ul className="divide-y divide-ink-100 rounded-surface border border-ink-200 bg-white">
              {channels.map((room) => (
                <li key={room.id} className="flex items-center gap-3 px-4 py-3">
                  <RoomIcon room={room} className="size-5 text-ink-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-900">{roomName(room, userId)}</p>
                    <p className="truncate text-sm text-ink-500">{roomText(room.topic)}</p>
                  </div>
                  <PersonStack userIds={room.members} size="xs" />
                  {isMember(room, userId) ? (
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/messages/${room.id}`)}>{t('rc.open')}</Button>
                  ) : (
                    <Button size="sm" onClick={() => { joinRoom(room.id, userId); navigate(`/messages/${room.id}`) }}>{t('rc.join')}</Button>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : people.length === 0 ? <EmptyState compact icon={Users} title={t('k.noResults')} /> : (
          <ul className="divide-y divide-ink-100 rounded-surface border border-ink-200 bg-white">
            {people.map((user) => (
              <li key={user.user_id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><PersonCell userId={user.user_id} card /></div>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/messages/${openDirect(userId, user.user_id)}`)}>{t('rc.message')}</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Panel({ mode, room, messages, onClose, quoteIn, openThread }: { mode: Exclude<PanelMode, 'thread' | null>; room: RcRoom; messages: RcMessage[]; onClose: () => void; quoteIn: (message: RcMessage) => void; openThread: (message: RcMessage) => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { userId } = useViewer()
  const presenceOf = usePresenceOf()
  const rooms = useRc((state) => state.rooms)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const titles: Record<typeof mode, string> = { members: t('rc.members'), mentions: t('rc.mentions'), search: t('rc.searchMessages'), threads: t('rc.threads'), discussions: t('rc.discussions'), info: t('rc.roomInfo'), pinned: t('rc.pinnedTitle'), files: t('rc.files') }
  const roomMessages = messages.filter((m) => m.rid === room.id && !m.system)
  const owns = room.ownerId === userId && room.t === 'c' && !room.id.startsWith('dept-')
  const candidates = allUsersExcept(userId).filter((user) => !room.members.includes(user.user_id))
  const needle = q.trim().toLowerCase()
  const members = room.members.filter((id) => id !== NEXA)
  const shownMembers = members.filter((id) => (!needle || userName(id).toLowerCase().includes(needle)) && (filter === 'all' || presenceOf(id) === 'online'))
  const row = (message: RcMessage) => (
    <li key={message.id} className="rounded-control border border-ink-200 p-2.5 text-sm">
      <p className="flex items-center justify-between text-xs text-ink-500"><PersonHover userId={message.uid} className="font-medium text-ink-700 hover:underline">{userName(message.uid)}</PersonHover><span>{formatDate(message.ts)} {formatTime(message.ts)}</span></p>
      <p className="mt-1 line-clamp-3 text-ink-800">{messageText(message) || message.attachment?.name}</p>
      <button type="button" onClick={() => quoteIn(message)} className="mt-1 text-xs font-medium text-brand-700 hover:underline">{t('rc.quote')}</button>
    </li>
  )
  const list = (items: RcMessage[], empty: string) => (items.length === 0 ? <p className="text-sm text-ink-500">{empty}</p> : <ul className="flex flex-col gap-2">{items.map(row)}</ul>)
  const threadRoots = roomMessages.filter((m) => !m.tmid && roomMessages.some((r) => r.tmid === m.id))
  const children = rooms.filter((entry) => entry.parentId === room.id)
  return (
    <aside className="flex min-h-0 flex-1 flex-col border-s border-ink-300 bg-brand-50/50" aria-label={titles[mode]}>
      <div className="flex items-center justify-between gap-2 border-b border-ink-300 px-4 py-3">
        <h3 className="text-base font-semibold text-ink-900">{titles[mode]}</h3>
        <IconButton icon={X} size="sm" label={t('act.close')} onClick={onClose} />
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
        {mode === 'members' && (
          <>
            <SearchInput value={q} onChange={setQ} placeholder={t('rc.searchUsername')} />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-ink-500">{t('rc.showing', { n: shownMembers.length, m: members.length })}</p>
              <Select aria-label={t('rc.status')} value={filter} onChange={(event) => setFilter(event.target.value)} options={[{ value: 'online', label: t('rc.filter.online') }, { value: 'all', label: t('rc.filter.all') }]} />
            </div>
            <ul className="mt-3 flex flex-col">
              {shownMembers.map((id) => (
                <li key={id} className="group flex items-center justify-between gap-2 rounded-control px-1 py-1.5 hover:bg-ink-25">
                  <PersonCell userId={id} size="md" subtitle={null} presence={presenceOf(id)} />
                  <span className="flex items-center gap-1">
                    {room.ownerId === id && <span className="rounded bg-brand-50 px-1.5 text-[10px] font-semibold text-brand-700">{t('rc.owner')}</span>}
                    <span className="hidden group-focus-within:block group-hover:block">
                      <Popover align="end" className="p-1.5" minWidth={176} trigger={({ toggle, open, id: controls }) => <IconButton icon={MoreHorizontal} size="sm" label={t('k.more')} onClick={toggle} aria-expanded={open} aria-controls={controls} />}>
                        {(close) => (
                          <div role="menu">
                            {id !== userId && <MenuItem icon={MessageSquarePlus} onSelect={() => { close(); navigate(`/messages/${openDirect(userId, id)}`) }}>{t('rc.message')}</MenuItem>}
                            {owns && id !== userId && <MenuItem tone="danger" onSelect={() => { removeMember(room.id, id); close() }}>{t('rc.removeMember')}</MenuItem>}
                          </div>
                        )}
                      </Popover>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {room.id.startsWith('dept-') && <p className="mt-3 text-sm text-ink-500">{t('rc.deptManaged')}</p>}
          </>
        )}
        {mode === 'mentions' && list(roomMessages.filter((m) => mentions(messageText(m), userId)), t('rc.noMentions'))}
        {mode === 'search' && (
          <>
            <SearchInput value={q} onChange={setQ} placeholder={t('rc.searchMessages')} />
            <div className="mt-3">{needle ? list(roomMessages.filter((m) => messageText(m).toLowerCase().includes(needle)), t('rc.noMatch')) : null}</div>
          </>
        )}
        {mode === 'threads' && (threadRoots.length === 0 ? <p className="text-sm text-ink-500">{t('rc.noThreads')}</p> : (
          <ul className="flex flex-col gap-2">
            {threadRoots.map((m) => (
              <li key={m.id} className="rounded-control border border-ink-200 p-2.5 text-sm">
                <p className="line-clamp-2 text-ink-800">{messageText(m) || m.attachment?.name}</p>
                <button type="button" onClick={() => openThread(m)} className="mt-1 text-xs font-medium text-brand-700 hover:underline">{t('rc.replies', { n: roomMessages.filter((r) => r.tmid === m.id).length })}</button>
              </li>
            ))}
          </ul>
        ))}
        {mode === 'discussions' && (children.length === 0 ? <p className="text-sm text-ink-500">{t('rc.noDiscussions')}</p> : (
          <ul className="flex flex-col gap-1">
            {children.map((entry) => (
              <li key={entry.id}><Link to={`/messages/${entry.id}`} className="block rounded-control px-2.5 py-2 text-base text-ink-800 hover:bg-ink-50">{roomName(entry, userId)}</Link></li>
            ))}
          </ul>
        ))}
        {mode === 'info' && (
          <dl className="flex flex-col gap-4 text-base">
            <div><dt className="text-sm text-ink-500">{t('rc.info.type')}</dt><dd className="text-ink-900">{room.t === 'c' ? t('rc.info.channel') : t('rc.info.direct')}</dd></div>
            {roomText(room.topic) && <div><dt className="text-sm text-ink-500">{t('rc.topic')}</dt><dd className="text-ink-900">{roomText(room.topic)}</dd></div>}
            {room.ownerId && <div><dt className="text-sm text-ink-500">{t('rc.owner')}</dt><dd className="text-ink-900">{userName(room.ownerId)}</dd></div>}
            <div><dt className="text-sm text-ink-500">{t('rc.info.members')}</dt><dd className="tabular text-ink-900">{members.length}</dd></div>
          </dl>
        )}
        {mode === 'pinned' && list(roomMessages.filter((m) => m.pinned), t('rc.noPinned'))}
        {mode === 'files' && list(roomMessages.filter((m) => m.attachment), t('rc.noFiles'))}
      </div>
      {mode === 'members' && owns && candidates.length > 0 && (
        <div className="border-t border-ink-100 p-3">
          <Popover align="start" placement="top" className="max-h-64 p-1.5" minWidth={240} trigger={({ toggle, open, id }) => <Button className="w-full" variant="secondary" icon={Plus} onClick={toggle} aria-expanded={open} aria-controls={id}>{t('rc.add')}</Button>}>
            {(close) => (
              <div role="menu">
                {candidates.map((user) => <MenuItem key={user.user_id} onSelect={() => { addMembers(room.id, [user.user_id]); close() }}>{user.first_name} {user.last_name}</MenuItem>)}
              </div>
            )}
          </Popover>
        </div>
      )}
    </aside>
  )
}

function RoomView({ room, nexa, onCreate }: { room: RcRoom; nexa: ReturnType<typeof useNexaFeed>; onCreate: (kind: CreateKind) => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { userId, role } = useViewer()
  const stored = useRc((state) => state.messages)
  const lastRead = useRc((state) => state.lastRead)
  const favorites = useRc((state) => state.favorites[userId]) ?? []
  const typing = useRc((state) => state.typing[room.id])
  const [panel, setPanel] = useState<PanelMode>(null)
  const [threadId, setThreadId] = useState<number | null>(null)
  const [quote, setQuote] = useState<RcMessage | null>(null)
  const [editing, setEditing] = useState<RcMessage | null>(null)
  const [topicOpen, setTopicOpen] = useState(false)
  const [topicText, setTopicText] = useState('')
  const [forwarding, setForwarding] = useState<RcMessage | null>(null)
  const [atBottom, setAtBottom] = useState(true)
  const [mark] = useState(() => lastRead[`${userId}:${room.id}`] ?? 0)
  const scroller = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | undefined>(undefined)

  const all = room.bot ? nexa.messages : stored.filter((m) => m.rid === room.id)
  const roots = all.filter((m) => !m.tmid)
  const visible = roots
  const unreadFrom = room.bot ? null : roots.find((m) => m.id > mark && m.uid !== userId)?.id ?? null
  const replies = (id: number) => all.filter((m) => m.tmid === id)
  const thread = threadId ? (all.find((m) => m.id === threadId) ?? null) : null
  const canPost = !room.readOnly || role === 'hr_admin' || room.ownerId === userId
  const canModerate = role === 'hr_admin' || room.ownerId === userId
  const favorite = favorites.includes(room.id)

  useEffect(() => {
    if (room.bot) markAllRead(userId)
    else markRead(room.id, userId)
  }, [room.id, room.bot, userId, all.length])

  useEffect(() => {
    const node = scroller.current
    if (node) node.scrollTop = node.scrollHeight
  }, [room.id])

  useEffect(() => {
    const node = scroller.current
    if (node && atBottom) node.scrollTop = node.scrollHeight
  }, [visible.length, atBottom])

  const botReply = (text: string) => {
    setTyping(room.id, NEXA)
    window.setTimeout(() => {
      const answer = answerFor(text, { role, userId, requests: [], balances: [], tasks: [], assignments: [], applications: [] })
      sendMessage(room.id, NEXA, t(`rc.bot.${answer.intent}` as 'rc.bot.greeting'))
      setTyping(room.id, null)
    }, 900)
  }

  const peerReply = () => {
    const peer = room.members.find((id) => id !== userId)
    if (!peer || room.t !== 'd') return
    setTyping(room.id, peer)
    window.setTimeout(() => {
      sendMessage(room.id, peer, t('rc.peerReply'))
      setTyping(room.id, null)
    }, 1600)
  }

  const send = ({ text, attachment }: SendPayload) => {
    if (editing) {
      editMessage(editing.id, text)
      setEditing(null)
      return
    }
    sendMessage(room.id, userId, text, { quote: quote?.id, tmid: panel === 'thread' ? (threadId ?? undefined) : undefined, attachment })
    setQuote(null)
    if (room.bot) botReply(text)
    else peerReply()
  }

  const command = (name: string, args: string) => {
    if (name === 'shrug') return `${args} ¯\\_(ツ)_/¯`.trim()
    if (name === 'tableflip') return `${args} (╯°□°）╯︵ ┻━┻`.trim()
    if (name === 'unflip') return `${args} ┬─┬ ノ( ゜-゜ノ)`.trim()
    if (name === 'lennyface') return `${args} ( ͡° ͜ʖ ͡°)`.trim()
    if (name === 'me') return args ? `_${args}_` : null
    if (name === 'topic') {
      if (!canModerate) toast.error(t('rc.noPermission'))
      else if (args) {
        setTopic(room.id, args)
        toast.success(t('rc.topicSaved'))
      }
      return null
    }
    if (name === 'invite' && room.id.startsWith('dept-')) {
      toast.error(t('rc.deptManaged'))
      return null
    }
    if (name === 'invite') {
      const target = allUsersExcept(userId).find((user) => `${user.first_name}`.toLowerCase() === args.replace('@', '').toLowerCase())
      if (!target) toast.error(t('rc.userNotFound'))
      else {
        addMembers(room.id, [target.user_id])
        toast.success(t('rc.invited', { name: userName(target.user_id) }))
      }
      return null
    }
    if (name === 'join') {
      navigate('/messages/directory')
      return null
    }
    if (name === 'leave') {
      if (room.bot || room.t === 'd') toast.error(t('rc.noPermission'))
      else {
        leaveRoom(room.id, userId)
        navigate('/messages')
      }
      return null
    }
    return null
  }

  const onTyping = () => {
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => undefined, 1000)
  }

  const days: { day: string; items: RcMessage[] }[] = []
  for (const message of visible) {
    const day = message.ts.slice(0, 10)
    const last = days[days.length - 1]
    if (last && last.day === day) last.items.push(message)
    else days.push({ day, items: [message] })
  }

  const rowProps = (message: RcMessage, compact: boolean, inThread?: boolean) => ({
    message,
    quoted: message.quote ? all.find((m) => m.id === message.quote) : undefined,
    replies: replies(message.id).length,
    compact,
    canModerate,
    roomId: room.id,
    inThread,
    link: nexa.links[message.id],
    onReply: (m: RcMessage) => {
      setThreadId(m.id)
      setPanel('thread')
    },
    onQuote: (m: RcMessage) => {
      setEditing(null)
      setQuote(m)
    },
    onEdit: (m: RcMessage) => {
      setQuote(null)
      setEditing(m)
    },
    onDelete: (m: RcMessage) => {
      deleteMessage(m.id)
      toast.success(t('rc.deleted'))
    },
    onReact: (m: RcMessage, emoji: string) => toggleReaction(m.id, emoji, userId),
    onPin: (m: RcMessage) => togglePin(m.id),
    onStar: (m: RcMessage) => toggleStar(m.id, userId),
    onForward: (m: RcMessage) => setForwarding(m),
    ownerId: room.ownerId,
  })

  const forwardTargets = useRc((state) => state.rooms).filter((entry) => entry.members.includes(userId) && entry.id !== room.id && (!entry.readOnly || role === 'hr_admin' || entry.ownerId === userId))
  const name = roomName(room, userId)
  const typingName = typing ? (typing === NEXA ? 'Nexa' : userName(typing)) : null

  return (
    <div className={cn('grid min-h-0 flex-1', panel ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : '')}>
      <section className="flex min-h-0 min-w-0 flex-col" aria-label={name}>
        <header className="flex flex-wrap items-center gap-2 border-b border-ink-300 bg-brand-50/40 sm:flex-nowrap px-4 py-2.5">
          <Link to="/messages" aria-label={t('detail.back')} className="grid size-8 place-items-center rounded-control text-ink-600 hover:bg-ink-100 lg:hidden"><ChevronLeft className="size-5 rtl:rotate-180" strokeWidth={1.75} /></Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <RoomIcon room={room} className="size-5 shrink-0 text-ink-500" />
            <h1 className="truncate text-base font-semibold text-ink-900">{name}</h1>
            {!room.bot && <IconButton icon={Star} size="sm" label={favorite ? t('rc.unfavorite') : t('rc.favorite')} onClick={() => toggleFavorite(room.id, userId)} className={cn(favorite && 'text-accent [&_svg]:fill-accent')} />}
            {roomText(room.topic) ? <span className="hidden truncate text-sm text-ink-500 2xl:block">{roomText(room.topic)}</span> : canModerate && !room.bot && room.t === 'c' ? <button type="button" onClick={() => { setTopicText(''); setTopicOpen(true) }} className="text-sm font-medium text-brand-700 hover:underline">{t('rc.addTopic')}</button> : null}
          </div>
          {!room.bot && (
            <div className="flex w-full items-center justify-end gap-0.5 sm:w-auto">
              {([
                ['members', Users, t('rc.members')],
                ['mentions', AtSign, t('rc.mentions')],
                ['search', Search, t('rc.searchMessages')],
                ['threads', MessageSquareReply, t('rc.threads')],
                ['discussions', MessagesSquare, t('rc.discussions')],
                ['info', Info, t('rc.roomInfo')],
              ] as const).map(([id, Icon, label]) => (
                <IconButton key={id} icon={Icon} size="sm" label={label} onClick={() => setPanel(panel === id ? null : id)} className={cn(panel === id && 'bg-brand-50 text-brand-700')} />
              ))}
              <Popover align="end" className="p-1.5" minWidth={176} trigger={({ toggle, open, id }) => <IconButton icon={MoreHorizontal} size="sm" label={t('k.more')} onClick={toggle} aria-expanded={open} aria-controls={id} />}>
                {(close) => (
                  <div role="menu">
                    <MenuItem icon={Pin} onSelect={() => { setPanel('pinned'); close() }}>{t('rc.pinnedTitle')}</MenuItem>
                    <MenuItem icon={FileText} onSelect={() => { setPanel('files'); close() }}>{t('rc.files')}</MenuItem>
                    {room.t === 'c' && !room.id.startsWith('dept-') && room.id !== 'all' && room.id !== 'announcements' && <MenuItem onSelect={() => { leaveRoom(room.id, userId); close(); navigate('/messages') }}>{t('rc.leave')}</MenuItem>}
                  </div>
                )}
              </Popover>
            </div>
          )}
        </header>
        <div className="relative min-h-0 flex-1">
          <div ref={scroller} onScroll={(event) => { const node = event.currentTarget; setAtBottom(node.scrollHeight - node.scrollTop - node.clientHeight < 80) }} className="scrollbar-thin h-full overflow-y-auto bg-white py-3">
            {days.length === 0 ? (
              <div className="grid h-full place-items-center"><p className="text-sm text-ink-500">{t('rc.start')}</p></div>
            ) : (
              <>
                <p className="px-5 pb-1 pt-4 text-center text-sm text-ink-500">{t('rc.start')}</p>
                {days.map((group) => (
                  <div key={group.day}>
                    <div className="my-3 flex items-center gap-3 px-5" role="separator"><span className="h-px flex-1 bg-ink-200" /><span className="rounded-full bg-ink-100 px-3 py-0.5 text-xs font-medium text-ink-600">{formatDate(group.day)}</span><span className="h-px flex-1 bg-ink-200" /></div>
                    <ul>
                      {group.items.map((message, index) => {
                        const previous = group.items[index - 1]
                        const compact = Boolean(previous && !previous.system && !message.system && previous.uid === message.uid && new Date(message.ts).getTime() - new Date(previous.ts).getTime() < 5 * 60 * 1000 && unreadFrom !== message.id)
                        return (
                          <div key={message.id}>
                            {unreadFrom === message.id && <div className="my-2 flex items-center gap-3 px-5 text-xs font-semibold text-danger" role="separator"><span className="h-px flex-1 bg-danger/40" />{t('rc.unreadDivider')}<span className="h-px flex-1 bg-danger/40" /></div>}
                            <MessageRow {...rowProps(message, compact)} />
                          </div>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </>
            )}
          </div>
          {!atBottom && (
            <button type="button" onClick={() => { const node = scroller.current; if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' }) }} className="absolute bottom-3 start-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg rtl:translate-x-1/2">
              <ArrowDown className="size-4" strokeWidth={2} />
              {t('rc.jump')}
            </button>
          )}
        </div>
        <p className="h-5 px-5 text-xs text-ink-500" aria-live="polite">{typingName ? t('rc.typing', { name: typingName }) : ''}</p>
        {canPost ? (
          <Composer key={`${room.id}-${editing?.id ?? 'new'}`} placeholder={t('rc.composer', { name: room.t === 'c' ? `#${name}` : name })} quote={quote} editing={editing} onClearQuote={() => setQuote(null)} onCancelEdit={() => setEditing(null)} onSend={send} onCommand={command} onTyping={onTyping} onDiscussion={() => onCreate('discussion')} />
        ) : (
          <p className="border-t border-ink-200 bg-ink-25 px-5 py-4 text-center text-sm text-ink-600">{t('rc.readOnly')}</p>
        )}
      </section>
      {panel && (
        <div className="hidden min-h-0 xl:flex xl:flex-col">
          {panel === 'thread' ? (
            thread && (
              <aside className="flex min-h-0 flex-1 flex-col border-s border-ink-300 bg-brand-50/50" aria-label={t('rc.thread')}>
                <div className="flex items-center justify-between gap-2 border-b border-ink-300 px-3 py-2.5">
                  <h3 className="text-sm font-semibold text-ink-900">{t('rc.thread')}</h3>
                  <IconButton icon={X} size="sm" label={t('act.close')} onClick={() => { setPanel(null); setThreadId(null) }} />
                </div>
                <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto py-2">
                  <MessageRow {...rowProps(thread, false, true)} />
                  {replies(thread.id).map((message) => (
                    <MessageRow key={message.id} {...rowProps(message, false, true)} />
                  ))}
                </ul>
                {canPost && <Composer key={`thread-${thread.id}`} placeholder={t('rc.threadComposer')} quote={null} editing={null} onClearQuote={() => undefined} onCancelEdit={() => undefined} onSend={send} onCommand={command} onTyping={onTyping} onDiscussion={() => onCreate('discussion')} />}
              </aside>
            )
          ) : (
            <Panel mode={panel} room={room} messages={all} onClose={() => setPanel(null)} quoteIn={(message) => setQuote(message)} openThread={(message) => { setThreadId(message.id); setPanel('thread') }} />
          )}
        </div>
      )}
      <Modal open={topicOpen} onClose={() => setTopicOpen(false)} size="sm" title={t('rc.addTopic')} footer={<><Button variant="secondary" onClick={() => setTopicOpen(false)}>{t('act.cancel')}</Button><Button disabled={!topicText.trim()} onClick={() => { setTopic(room.id, topicText.trim()); toast.success(t('rc.topicSaved')); setTopicOpen(false) }}>{t('act.save')}</Button></>}>
        <Input value={topicText} onChange={(event) => setTopicText(event.target.value)} maxLength={120} aria-label={t('rc.topic')} />
      </Modal>
      <Modal open={forwarding !== null} onClose={() => setForwarding(null)} size="sm" title={t('rc.forwardTo')} footer={<Button variant="secondary" onClick={() => setForwarding(null)}>{t('act.cancel')}</Button>}>
        <ul className="flex flex-col">
          {forwardTargets.map((target) => (
            <li key={target.id}>
              <button type="button" onClick={() => { if (forwarding) sendMessage(target.id, userId, messageText(forwarding), { attachment: forwarding.attachment }); setForwarding(null); toast.success(t('rc.forwarded')) }} className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-start text-base text-ink-800 hover:bg-ink-50">
                <RoomIcon room={target} className="size-4 text-ink-500" />
                <span className="truncate">{roomName(target, userId)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}

function ChatFrame({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-ink-300 bg-white">
      <div className="flex items-center gap-3 border-b border-ink-300 bg-brand-50/50 px-3 py-3" aria-hidden>
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-10 max-w-xl flex-1" />
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col gap-4 border-e border-ink-300 bg-brand-50/50 p-4 lg:flex" aria-label={t('rc.sidebar')} aria-hidden>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <Skeleton className="size-8" />
              <Skeleton className="h-3.5 flex-1" />
            </div>
          ))}
        </aside>
        <main className="grid min-h-0 min-w-0 place-items-center bg-white p-6" aria-label={t('nav.messages')}>{children}</main>
      </div>
    </div>
  )
}

export function MessagesPage() {
  const { t } = useI18n()
  const chat = useChatState()
  const { id } = useParams()
  const rooms = useRooms()
  const nexa = useNexaFeed()
  const [create, setCreate] = useState<CreateKind | null>(null)
  const room = id && id !== 'directory' ? rooms.find((entry) => entry.id === id) : undefined
  const view: 'home' | 'directory' | 'room' = id === 'directory' ? 'directory' : room ? 'room' : 'home'
  const nexaLast = nexa.messages[nexa.messages.length - 1]?.ts ?? ''
  if (chat === 'connecting') return <ChatFrame><p role="status" className="text-base text-ink-600">{t('rc.conn.connecting')}</p></ChatFrame>
  if (chat === 'unavailable') {
    return (
      <ChatFrame>
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-ink-900">{t('rc.conn.unavailable')}</h1>
          <Button onClick={retryChat}>{t('act.retry')}</Button>
          <p className="text-sm text-ink-500">{t('rc.conn.rest')}</p>
        </div>
      </ChatFrame>
    )
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-ink-300 bg-white">
      {(chat === 'expired' || chat === 'reconnecting') && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-warning-border bg-warning-bg px-4 py-2 text-sm text-warning">
          {t('rc.conn.expired')}
          <Button size="sm" variant="secondary" loading={chat === 'reconnecting'} onClick={reconnectChat}>{t('rc.conn.reconnect')}</Button>
        </div>
      )}
      <MessagesToolbar onCreate={setCreate} />
      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className={cn('min-h-0 flex-col border-e border-ink-300 bg-brand-50/50', view === 'room' ? 'hidden lg:flex' : 'flex')} aria-label={t('rc.sidebar')}>
          <RoomList activeId={room?.id} nexaUnread={nexa.unread} nexaLast={nexaLast} />
        </aside>
        <main className={cn('flex min-h-0 min-w-0 flex-col bg-white', view !== 'room' && 'hidden lg:flex')} aria-label={t('nav.messages')}>
          {view === 'room' && room ? <RoomView key={room.id} room={room} nexa={nexa} onCreate={setCreate} /> : view === 'directory' ? <DirectoryView /> : <HomeView onCreate={setCreate} />}
        </main>
      </div>
      {create && <CreateModal kind={create} onClose={() => setCreate(null)} />}
    </div>
  )
}
