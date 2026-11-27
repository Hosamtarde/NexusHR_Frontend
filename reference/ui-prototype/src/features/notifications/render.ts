import { getLang, tr, type TKey } from '@/i18n'
import { formatDateTime } from '@/lib/format'
import { userName } from '@/features/employees/data'
import type { NotifParams, Person, StoredNotification } from './data'

const person = (value: Person | undefined) => (value == null ? '' : typeof value === 'number' ? userName(value) : value[getLang()])

export function renderNotification(item: StoredNotification) {
  const p: NotifParams = item.params
  const params = {
    actor: person(p.actor),
    subject: person(p.subject),
    kind: p.kind ? tr(p.kind) : '',
    status: p.status ? tr(p.status) : '',
    decision: p.decision ? tr(p.decision) : '',
    title: p.title ? p.title[getLang()] : '',
    n: p.n ?? 0,
    when: p.when ? formatDateTime(p.when) : '',
  }
  return {
    title: tr(`n.${item.type}.title` as TKey),
    message: tr(`n.${item.type}.msg` as TKey, params),
  }
}
