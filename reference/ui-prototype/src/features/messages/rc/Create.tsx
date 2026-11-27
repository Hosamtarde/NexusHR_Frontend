import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { Button, Field, Input, Modal, SearchInput, Select, Switch, useToast } from '@/components/ui'
import { PersonCell } from '@/components/shared/Person'
import { allUsersExcept, createChannel, createDiscussion, openDirect, roomName, useRc } from './rc'

export type CreateKind = 'channel' | 'direct' | 'discussion'

export function CreateModal({ kind, onClose }: { kind: CreateKind; onClose: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { userId, role } = useViewer()
  const rooms = useRc((state) => state.rooms)
  const parents = rooms.filter((room) => room.t === 'c' && !room.parentId && room.members.includes(userId))
  const [name, setName] = useState('')
  const [topic, setTopicText] = useState('')
  const [parent, setParent] = useState(parents[0]?.id ?? '')
  const [picked, setPicked] = useState<number[]>([])
  const [readOnly, setReadOnly] = useState(false)
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const people = allUsersExcept(userId).filter((user) => `${user.first_name} ${user.last_name}`.toLowerCase().includes(q.trim().toLowerCase()))
  const toggle = (id: number) => setPicked((list) => (list.includes(id) ? list.filter((entry) => entry !== id) : kind === 'direct' ? [id] : [...list, id]))
  const title = kind === 'channel' ? t('rc.create.channel') : kind === 'direct' ? t('rc.create.direct') : t('rc.create.discussion')

  const save = () => {
    if (kind === 'direct') {
      if (picked.length === 0) return setError(t('rc.create.errPerson'))
      navigate(`/messages/${openDirect(userId, picked[0]!)}`)
    } else if (kind === 'channel') {
      if (name.trim().length < 2) return setError(t('rc.create.errName'))
      const id = createChannel(name, topic, picked, userId, readOnly)
      toast.success(t('rc.create.channelDone', { name: name.trim() }))
      navigate(`/messages/${id}`)
    } else {
      if (!parent || name.trim().length < 2) return setError(t('rc.create.errName'))
      navigate(`/messages/${createDiscussion(parent, name, userId)}`)
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={title} footer={<><Button variant="secondary" onClick={onClose}>{t('act.cancel')}</Button><Button onClick={save}>{t('rc.create.submit')}</Button></>}>
      <div className="flex flex-col gap-4">
        {kind === 'discussion' && (
          <Field label={t('rc.create.parent')} required>
            <Select value={parent} onChange={(event) => setParent(event.target.value)} options={parents.map((room) => ({ value: room.id, label: roomName(room, userId) }))} />
          </Field>
        )}
        {kind !== 'direct' && (
          <Field label={kind === 'discussion' ? t('rc.create.discussionName') : t('rc.create.name')} required error={error || undefined}>
            <Input value={name} onChange={(event) => { setName(event.target.value); setError('') }} maxLength={60} />
          </Field>
        )}
        {kind === 'channel' && (
          <>
            <Field label={t('rc.topic')} optional><Input value={topic} onChange={(event) => setTopicText(event.target.value)} maxLength={120} /></Field>
            {role === 'hr_admin' && <Switch checked={readOnly} onChange={setReadOnly} label={t('rc.create.readOnly')} />}
          </>
        )}
        {kind !== 'discussion' && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink-800">{kind === 'channel' ? t('rc.create.members') : t('rc.create.pick')}</p>
            <SearchInput value={q} onChange={setQ} placeholder={t('rc.searchPeople')} />
            {kind === 'direct' && error && <p className="mt-1 text-sm text-danger">{error}</p>}
            <ul className="scrollbar-thin mt-2 max-h-56 overflow-y-auto rounded-surface border border-ink-200">
              {people.map((user) => (
                <li key={user.user_id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-ink-25">
                    <input type={kind === 'direct' ? 'radio' : 'checkbox'} name="rc-people" checked={picked.includes(user.user_id)} onChange={() => { toggle(user.user_id); setError('') }} className="accent-brand-600" />
                    <PersonCell userId={user.user_id} size="xs" card={false} />
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
