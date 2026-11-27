import { useSyncExternalStore } from 'react'
import type { Localized } from '@/i18n'
import { getLang } from '@/i18n'
import { seedConversations, seedMessages, NEXA } from '@/features/messages/data'
import { users } from '@/features/employees/data'

export type RoomType = 'c' | 'd'

export interface RcRoom {
  id: string
  t: RoomType
  name: Localized | string | null
  topic: Localized | string
  members: number[]
  ownerId: number | null
  readOnly: boolean
  bot: boolean
  parentId?: string
}

export interface RcAttachment {
  name: string
  size: number
  image: boolean
  url?: string
}

export interface RcMessage {
  id: number
  rid: string
  uid: number
  text: string
  textL?: Localized
  ts: string
  edited?: boolean
  quote?: number
  tmid?: number
  reactions: Record<string, number[]>
  pinned?: boolean
  starred: number[]
  attachment?: RcAttachment
  system?: 'joined'
}

export type Presence = 'online' | 'away' | 'busy' | 'offline'
export type Density = 'extended' | 'medium' | 'condensed'

export interface Display {
  density: Density
  avatars: boolean
  sort: 'activity' | 'name'
  groupUnread: boolean
  groupFavorites: boolean
  groupTypes: boolean
}

interface RcState {
  rooms: RcRoom[]
  messages: RcMessage[]
  favorites: Record<number, string[]>
  lastRead: Record<string, number>
  typing: Record<string, number | null>
  display: Display
  hidden: Record<number, string[]>
  status: Record<number, { presence: Presence; text: string }>
  collapsed: Record<string, boolean>
}

const textOf = (value: Localized | string | null | undefined) => (value == null ? '' : typeof value === 'string' ? value : value[getLang()])
export const roomText = textOf

export const roomName = (room: RcRoom, me: number) => {
  if (room.bot) return room.name ? textOf(room.name) : 'Nexa'
  if (room.t === 'd') {
    const other = users.find((user) => user.user_id === room.members.find((id) => id !== me))
    return other ? `${other.first_name} ${other.last_name}` : textOf(room.name)
  }
  return textOf(room.name)
}

const directIds = (rooms: RcRoom[]) => new Set(rooms.map((room) => room.id))

const roomsSeed = (): RcRoom[] => {
  const channels: RcRoom[] = seedConversations
    .filter((conv) => conv.kind === 'channel')
    .map((conv) => ({
      id: conv.id,
      t: 'c',
      name: conv.name,
      topic: conv.id === 'announcements' ? { ar: 'إعلانات رسمية من الموارد البشرية. للقراءة فقط.', en: 'Official announcements from HR. Read only.' } : conv.id === 'all' ? { ar: 'نقاش عام لكل الموظفين', en: 'General conversation for every employee' } : { ar: 'قناة القسم', en: 'Department channel' },
      members: conv.members,
      ownerId: 1,
      readOnly: Boolean(conv.readOnly),
      bot: false,
    }))
  const directs: RcRoom[] = seedConversations
    .filter((conv) => conv.kind === 'direct')
    .map((conv) => ({ id: conv.id, t: 'd', name: null, topic: '', members: conv.members, ownerId: null, readOnly: false, bot: false }))
  return [...channels, ...directs]
}

const messagesSeed = (): RcMessage[] => {
  const list: RcMessage[] = []
  for (const item of seedMessages) {
    if (item.body.kind !== 'seed' && item.body.kind !== 'file') continue
    if (item.convId.startsWith('nexa')) continue
    list.push({
      id: item.id,
      rid: item.convId,
      uid: item.senderId,
      text: '',
      textL: item.body.kind === 'seed' ? item.body.text : undefined,
      ts: item.at,
      reactions: item.convId === 'announcements' && item.pinned ? { '👍': [2, 3, 5], '🎉': [4] } : {},
      pinned: item.pinned,
      starred: [],
      attachment: item.body.kind === 'file' ? { name: item.body.name, size: item.body.size, image: false } : undefined,
    })
  }
  return list
}

const lastReadSeed = (messages: RcMessage[]) => {
  const result: Record<string, number> = {}
  const readers = new Map<number, Set<number>>()
  for (const item of seedMessages) readers.set(item.id, new Set(item.readBy))
  for (const user of users) {
    for (const room of roomsSeed()) {
      if (!room.members.includes(user.user_id)) continue
      const own = messages.filter((m) => m.rid === room.id)
      const seen = own.filter((m) => readers.get(m.id)?.has(user.user_id))
      result[`${user.user_id}:${room.id}`] = seen.length ? Math.max(...seen.map((m) => m.id)) : 0
    }
  }
  return result
}

const initialMessages = messagesSeed()
let nextId = Math.max(1000, ...initialMessages.map((m) => m.id)) + 1

const extras = (): RcMessage[] => {
  const first = initialMessages.find((m) => m.rid === 'dept-2')
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600 * 1000).toISOString()
  if (!first) return []
  first.reactions = { '👍': [5, 6], '✅': [7] }
  const target = users.find((user) => user.user_id === 5)?.first_name ?? ''
  return [
    { id: nextId++, rid: 'dept-2', uid: 2, text: '', textL: { ar: `@${target} هل راجعت توثيق الواجهات؟`, en: `@${target} did you review the API documentation?` }, ts: hoursAgo(2), reactions: {}, starred: [] },
    { id: nextId++, rid: 'dept-2', uid: 6, text: '', textL: { ar: 'نعم، وأضفت ملاحظاتي في الملف.', en: 'Yes, and I added my notes to the file.' }, ts: hoursAgo(1.5), tmid: first.id, reactions: {}, starred: [] },
  ]
}
initialMessages.push(...extras())

let state: RcState = {
  rooms: roomsSeed(),
  messages: initialMessages,
  favorites: { 1: ['dept-1'], 2: ['dept-2'], 5: ['dept-2'] },
  lastRead: lastReadSeed(initialMessages),
  typing: {},
  display: { density: 'medium', avatars: true, sort: 'activity', groupUnread: false, groupFavorites: true, groupTypes: true },
  hidden: {},
  status: {},
  collapsed: {},
}

const listeners = new Set<() => void>()
const commit = (patch: Partial<RcState>) => {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

export function useRc<T>(select: (value: RcState) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => select(state),
  )
}

export const nexaRoomId = (uid: number) => `nexa-${uid}`

export const botRoom = (uid: number): RcRoom => ({ id: nexaRoomId(uid), t: 'd', name: { ar: 'نيكسا', en: 'Nexa' }, topic: { ar: 'مساعد نيكسا. تصلك هنا إشعارات النظام.', en: 'Nexa assistant. System notifications arrive here.' }, members: [uid, NEXA], ownerId: null, readOnly: false, bot: true })

export const isMember = (room: RcRoom, uid: number) => room.members.includes(uid)


export const unreadIn = (messages: RcMessage[], lastRead: Record<string, number>, rid: string, uid: number) => {
  const mark = lastRead[`${uid}:${rid}`] ?? 0
  return messages.filter((m) => m.rid === rid && m.id > mark && m.uid !== uid && !m.tmid && !m.system)
}

export const mentions = (text: string, uid: number) => {
  const user = users.find((entry) => entry.user_id === uid)
  return Boolean(user) && (text.includes(`@${user!.first_name}`) || text.includes('@all'))
}

export function sendMessage(rid: string, uid: number, text: string, extra: { quote?: number; tmid?: number; attachment?: RcAttachment } = {}) {
  const message: RcMessage = { id: nextId++, rid, uid, text, ts: new Date().toISOString(), reactions: {}, starred: [], ...extra }
  commit({ messages: [...state.messages, message], lastRead: { ...state.lastRead, [`${uid}:${rid}`]: message.id } })
  return message
}

export function editMessage(id: number, text: string) {
  commit({ messages: state.messages.map((m) => (m.id === id ? { ...m, text, textL: undefined, edited: true } : m)) })
}

export function deleteMessage(id: number) {
  commit({ messages: state.messages.filter((m) => m.id !== id && m.tmid !== id) })
}

export function toggleReaction(id: number, emoji: string, uid: number) {
  commit({
    messages: state.messages.map((m) => {
      if (m.id !== id) return m
      const current = m.reactions[emoji] ?? []
      const next = current.includes(uid) ? current.filter((entry) => entry !== uid) : [...current, uid]
      const reactions = { ...m.reactions }
      if (next.length) reactions[emoji] = next
      else delete reactions[emoji]
      return { ...m, reactions }
    }),
  })
}

export const togglePin = (id: number) => commit({ messages: state.messages.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)) })

export const toggleStar = (id: number, uid: number) => commit({ messages: state.messages.map((m) => (m.id === id ? { ...m, starred: m.starred.includes(uid) ? m.starred.filter((entry) => entry !== uid) : [...m.starred, uid] } : m)) })

export function toggleFavorite(rid: string, uid: number) {
  const list = state.favorites[uid] ?? []
  commit({ favorites: { ...state.favorites, [uid]: list.includes(rid) ? list.filter((id) => id !== rid) : [...list, rid] } })
}

export function markRead(rid: string, uid: number) {
  const last = Math.max(0, ...state.messages.filter((m) => m.rid === rid).map((m) => m.id))
  if ((state.lastRead[`${uid}:${rid}`] ?? 0) >= last) return
  commit({ lastRead: { ...state.lastRead, [`${uid}:${rid}`]: last } })
}

export function openDirect(a: number, b: number) {
  const existing = state.rooms.find((room) => room.t === 'd' && !room.bot && room.members.includes(a) && room.members.includes(b))
  if (existing) return existing.id
  const id = `dm-${Math.min(a, b)}-${Math.max(a, b)}`
  commit({ rooms: [...state.rooms, { id, t: 'd', name: null, topic: '', members: [a, b], ownerId: null, readOnly: false, bot: false }] })
  return id
}

export function createChannel(name: string, topic: string, members: number[], owner: number, readOnly: boolean) {
  const base = name.trim().toLowerCase().replace(/\s+/g, '-')
  let id = base
  let n = 2
  while (directIds(state.rooms).has(id)) id = `${base}-${n++}`
  const everyone = [...new Set([owner, ...members])]
  commit({ rooms: [...state.rooms, { id, t: 'c', name: name.trim(), topic, members: everyone, ownerId: owner, readOnly, bot: false }], messages: [...state.messages, ...everyone.map((uid) => systemJoin(id, uid))] })
  return id
}

export function createDiscussion(parentId: string, name: string, owner: number) {
  const parent = state.rooms.find((room) => room.id === parentId)
  const id = `disc-${nextId++}`
  commit({ rooms: [...state.rooms, { id, t: 'c', name: name.trim(), topic: '', members: parent ? [...new Set([owner, ...parent.members])] : [owner], ownerId: owner, readOnly: false, bot: false, parentId }] })
  return id
}

export const setDisplay = (patch: Partial<Display>) => commit({ display: { ...state.display, ...patch } })

export function hideRoom(rid: string, uid: number) {
  const list = state.hidden[uid] ?? []
  if (!list.includes(rid)) commit({ hidden: { ...state.hidden, [uid]: [...list, rid] } })
}

export const unhideRoom = (rid: string, uid: number) => commit({ hidden: { ...state.hidden, [uid]: (state.hidden[uid] ?? []).filter((id) => id !== rid) } })

export const setStatus = (uid: number, presence: Presence, text: string) => commit({ status: { ...state.status, [uid]: { presence, text } } })

export const toggleSection = (key: string) => commit({ collapsed: { ...state.collapsed, [key]: !state.collapsed[key] } })

export const lastActivity = (messages: RcMessage[], rid: string) => messages.reduce((latest, m) => (m.rid === rid && m.ts > latest ? m.ts : latest), '')

const systemJoin = (rid: string, uid: number): RcMessage => ({ id: nextId++, rid, uid, text: '', ts: new Date().toISOString(), reactions: {}, starred: [], system: 'joined' })

export function joinRoom(rid: string, uid: number) {
  const target = state.rooms.find((room) => room.id === rid)
  if (!target || target.members.includes(uid)) return
  commit({ rooms: state.rooms.map((room) => (room.id === rid ? { ...room, members: [...room.members, uid] } : room)), messages: [...state.messages, systemJoin(rid, uid)] })
}

export const leaveRoom = (rid: string, uid: number) => commit({ rooms: state.rooms.map((room) => (room.id === rid ? { ...room, members: room.members.filter((id) => id !== uid) } : room)) })

export function addMembers(rid: string, ids: number[]) {
  const target = state.rooms.find((room) => room.id === rid)
  if (!target) return
  const added = ids.filter((id) => !target.members.includes(id))
  commit({ rooms: state.rooms.map((room) => (room.id === rid ? { ...room, members: [...room.members, ...added] } : room)), messages: [...state.messages, ...added.map((id) => systemJoin(rid, id))] })
}

export const removeMember = (rid: string, uid: number) => commit({ rooms: state.rooms.map((room) => (room.id === rid ? { ...room, members: room.members.filter((id) => id !== uid) } : room)) })

export const setTopic = (rid: string, topic: string) => commit({ rooms: state.rooms.map((room) => (room.id === rid ? { ...room, topic } : room)) })

export function setTyping(rid: string, uid: number | null) {
  commit({ typing: { ...state.typing, [rid]: uid } })
}

export function allUsersExcept(uid: number) {
  return users.filter((user) => user.status && user.user_id !== uid)
}
