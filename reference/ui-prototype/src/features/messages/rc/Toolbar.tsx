import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Check, Compass, Hash, Home, LogOut, MessageSquarePlus, MessagesSquare, Plus, Search, SlidersHorizontal, UserRound, Keyboard } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { ConfirmDialog, IconButton, Input, MenuDivider, MenuItem, Modal, Popover, Button } from '@/components/ui'
import { Floating } from '@/components/ui/floating'
import { PersonCell } from '@/components/shared/Person'
import { presenceTone } from '@/lib/presence'
import { allUsersExcept, openDirect, roomName, setDisplay, setStatus, useRc, type Density, type Presence } from './rc'
import { usePresenceOf } from './presence'
import type { CreateKind } from './Create'

const presences: Presence[] = ['online', 'away', 'busy', 'offline']

function Dot({ presence }: { presence: Presence }) {
  return <span className={cn('size-2.5 shrink-0 rounded-full', presenceTone[presence])} aria-hidden />
}

function RoomSearch() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { userId } = useViewer()
  const rooms = useRc((state) => state.rooms)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const anchor = useRef<HTMLDivElement>(null)
  const needle = q.trim().toLowerCase()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        input.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const roomHits = needle ? rooms.filter((room) => room.members.includes(userId) && roomName(room, userId).toLowerCase().includes(needle)) : []
  const peopleHits = needle ? allUsersExcept(userId).filter((user) => `${user.first_name} ${user.last_name}`.toLowerCase().includes(needle)) : []
  const go = (to: string) => {
    setQ('')
    setOpen(false)
    navigate(to)
  }

  return (
    <div ref={anchor} className="relative mx-auto w-full max-w-xl">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" strokeWidth={1.75} aria-hidden />
      <Input
        ref={input}
        value={q}
        onChange={(event) => { setQ(event.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={t('rc.searchKey')}
        aria-label={t('rc.searchKey')}
        className="bg-white ps-9"
      />
      <Floating open={open && needle.length > 0} anchorRef={anchor} onClose={() => setOpen(false)} matchWidth role="listbox" focusFirst={false} className="p-1.5">
        {roomHits.length === 0 && peopleHits.length === 0 ? (
          <p className="px-3 py-2 text-sm text-ink-500">{t('rc.noMatch')}</p>
        ) : (
          <ul>
            {roomHits.map((room) => (
              <li key={room.id}>
                <button type="button" onClick={() => go(`/messages/${room.id}`)} className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-start text-sm text-ink-800 hover:bg-ink-50">
                  {room.t === 'c' ? <Hash className="size-4 text-ink-500" strokeWidth={1.75} /> : <MessagesSquare className="size-4 text-ink-500" strokeWidth={1.75} />}
                  <span className="truncate">{roomName(room, userId)}</span>
                </button>
              </li>
            ))}
            {peopleHits.map((user) => (
              <li key={`u${user.user_id}`}>
                <button type="button" onClick={() => go(`/messages/${openDirect(userId, user.user_id)}`)} className="flex w-full items-center rounded-control px-2.5 py-1.5 text-start hover:bg-ink-50">
                  <PersonCell userId={user.user_id} size="xs" card={false} compact />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Floating>
    </div>
  )
}

function UserMenu() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { userId, user, signOut } = useViewer()
  const presenceOf = usePresenceOf()
  const status = useRc((state) => state.status[userId])
  const [text, setText] = useState(status?.text ?? '')
  const [keys, setKeys] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const current = presenceOf(userId)
  const label = (value: Presence) => t(`rc.status.${value}` as 'rc.status.online')

  return (
    <>
      <Popover
        align="start"
        className="p-2"
        minWidth={272}
        trigger={({ toggle, open, id }) => (
          <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id} aria-label={`${user.first_name} ${user.last_name}`} className="rounded-full">
            <PersonCell userId={userId} avatarOnly card={false} size="md" presence={current} />
          </button>
        )}
      >
        {(close) => (
          <div role="menu">
            <div className="flex items-center gap-3 px-2 pb-2 pt-1">
              <PersonCell userId={userId} card={false} size="md" subtitle={status?.text ? status.text : null} />
            </div>
            <MenuDivider />
            <p className="px-2.5 pb-1 pt-1.5 text-xs font-semibold text-ink-500">{t('rc.status')}</p>
            <div className="px-1.5 pb-1.5">
              <Input value={text} onChange={(event) => setText(event.target.value)} onBlur={() => setStatus(userId, current, text.trim())} onKeyDown={(event) => { if (event.key === 'Enter') { setStatus(userId, current, text.trim()); event.currentTarget.blur() } }} placeholder={t('rc.status.custom')} maxLength={60} aria-label={t('rc.status.custom')} />
            </div>
            {presences.map((value) => (
              <button key={value} type="button" role="menuitemradio" aria-checked={current === value} onClick={() => setStatus(userId, value, text.trim())} className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-start text-base text-ink-700 hover:bg-ink-50">
                <Dot presence={value} />
                <span className="flex-1">{label(value)}</span>
                {current === value && <Check className="size-4 text-brand-600" strokeWidth={2} aria-hidden />}
              </button>
            ))}
            <MenuDivider />
            <MenuItem icon={UserRound} onSelect={() => { close(); navigate('/account/profile') }}>{t('rc.profile')}</MenuItem>
            <MenuItem icon={Keyboard} onSelect={() => { close(); setKeys(true) }}>{t('rc.shortcuts')}</MenuItem>
            <MenuItem icon={LogOut} onSelect={() => { close(); setLeaving(true) }}>{t('top.signOut')}</MenuItem>
          </div>
        )}
      </Popover>
      <Modal open={keys} onClose={() => setKeys(false)} size="sm" title={t('rc.shortcuts')} footer={<Button onClick={() => setKeys(false)}>{t('act.close')}</Button>}>
        <dl className="divide-y divide-ink-100 text-base">
          {[
            ['Ctrl K', t('rc.keys.search')],
            ['Enter', t('rc.keys.send')],
            ['Shift Enter', t('rc.keys.newline')],
            ['Esc', t('rc.keys.escape')],
          ].map(([keysText, description]) => (
            <div key={keysText} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-ink-700">{description}</dt>
              <dd><kbd className="rounded border border-ink-200 bg-ink-50 px-2 py-0.5 font-mono text-sm text-ink-800" dir="ltr">{keysText}</kbd></dd>
            </div>
          ))}
        </dl>
      </Modal>
      <ConfirmDialog open={leaving} onClose={() => setLeaving(false)} onConfirm={() => { signOut(); navigate('/login') }} title={t('top.signOutTitle')} description={t('top.signOutDesc')} confirmLabel={t('top.signOut')} tone="danger" />
    </>
  )
}

function Choice({ checked, onChange, children, type }: { checked: boolean; onChange: () => void; children: string; type: 'radio' | 'checkbox' }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-control px-2.5 py-1.5 text-base text-ink-700 hover:bg-ink-50">
      <input type={type} checked={checked} onChange={onChange} className="accent-brand-600" />
      {children}
    </label>
  )
}

function DisplayMenu() {
  const { t } = useI18n()
  const display = useRc((state) => state.display)
  const densities: Density[] = ['extended', 'medium', 'condensed']
  return (
    <Popover align="end" className="p-2" minWidth={256} trigger={({ toggle, open, id }) => <IconButton icon={SlidersHorizontal} label={t('rc.display')} onClick={toggle} aria-expanded={open} aria-controls={id} className={cn(open && 'bg-brand-50 text-brand-700')} />}>
      {() => (
        <div>
          <p className="px-2.5 pb-1 pt-1 text-xs font-semibold text-ink-500">{t('rc.density')}</p>
          {densities.map((value) => (
            <Choice key={value} type="radio" checked={display.density === value} onChange={() => setDisplay({ density: value })}>{t(`rc.density.${value}` as 'rc.density.medium')}</Choice>
          ))}
          <MenuDivider />
          <Choice type="checkbox" checked={display.avatars} onChange={() => setDisplay({ avatars: !display.avatars })}>{t('rc.avatars')}</Choice>
          <MenuDivider />
          <p className="px-2.5 pb-1 pt-1 text-xs font-semibold text-ink-500">{t('rc.sortBy')}</p>
          <Choice type="radio" checked={display.sort === 'activity'} onChange={() => setDisplay({ sort: 'activity' })}>{t('rc.sort.activity')}</Choice>
          <Choice type="radio" checked={display.sort === 'name'} onChange={() => setDisplay({ sort: 'name' })}>{t('rc.sort.name')}</Choice>
          <MenuDivider />
          <p className="px-2.5 pb-1 pt-1 text-xs font-semibold text-ink-500">{t('rc.groupBy')}</p>
          <Choice type="checkbox" checked={display.groupUnread} onChange={() => setDisplay({ groupUnread: !display.groupUnread })}>{t('rc.group.unread')}</Choice>
          <Choice type="checkbox" checked={display.groupFavorites} onChange={() => setDisplay({ groupFavorites: !display.groupFavorites })}>{t('rc.favorites')}</Choice>
          <Choice type="checkbox" checked={display.groupTypes} onChange={() => setDisplay({ groupTypes: !display.groupTypes })}>{t('rc.group.types')}</Choice>
        </div>
      )}
    </Popover>
  )
}

export function MessagesToolbar({ onCreate }: { onCreate: (kind: CreateKind) => void }) {
  const { t, dir } = useI18n()
  const navigate = useNavigate()
  const Back = dir === 'rtl' ? ArrowRight : ArrowLeft
  const Next = dir === 'rtl' ? ArrowLeft : ArrowRight
  return (
    <div className="relative flex items-center gap-2 border-b border-brand-200 bg-brand-600/5 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-gradient-to-r after:from-brand-600 after:via-brand-300 after:to-transparent rtl:after:bg-gradient-to-l px-3 py-2.5 [&_button[title]:hover]:bg-brand-600/10">
      <UserMenu />
      <div className="hidden items-center gap-0.5 sm:flex">
        <IconButton icon={Back} label={t('rc.back')} onClick={() => navigate(-1)} />
        <IconButton icon={Next} label={t('rc.forward')} onClick={() => navigate(1)} />
      </div>
      <div className="min-w-0 flex-1"><RoomSearch /></div>
      <div className="flex items-center gap-0.5">
        <Popover align="end" className="p-1.5" minWidth={192} trigger={({ toggle, open, id }) => <IconButton icon={Plus} label={t('rc.createNew')} onClick={toggle} aria-expanded={open} aria-controls={id} className={cn(open && 'bg-brand-50 text-brand-700')} />}>
          {(close) => (
            <div role="menu">
              <MenuItem icon={MessageSquarePlus} onSelect={() => { close(); onCreate('direct') }}>{t('rc.create.direct')}</MenuItem>
              <MenuItem icon={MessagesSquare} onSelect={() => { close(); onCreate('discussion') }}>{t('rc.create.discussion')}</MenuItem>
              <MenuItem icon={Hash} onSelect={() => { close(); onCreate('channel') }}>{t('rc.create.channel')}</MenuItem>
            </div>
          )}
        </Popover>
        <DisplayMenu />
        <Link to="/messages/directory" aria-label={t('rc.directory')} title={t('rc.directory')} className="grid size-9 place-items-center rounded-control text-ink-600 hover:bg-ink-100"><Compass className="size-5" strokeWidth={1.75} /></Link>
        <Link to="/messages" aria-label={t('rc.home')} title={t('rc.home')} className="grid size-9 place-items-center rounded-control text-ink-600 hover:bg-ink-100"><Home className="size-5" strokeWidth={1.75} /></Link>
      </div>
    </div>
  )
}
