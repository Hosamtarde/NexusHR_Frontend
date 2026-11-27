import { useNavigate } from 'react-router'
import { MessagesSquare } from 'lucide-react'
import { useI18n } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { Button, useToast } from '@/components/ui'
import { useStore } from '@/store'
import { users } from '@/features/employees/data'
import { getProfile } from '@/features/employees/data'
import type { RecordRef } from './data'
import { openDirect, sendMessage } from './rc/rc'

export function DiscussButton({ record }: { record: RecordRef }) {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { userId } = useViewer()
  const requests = useStore((state) => state.requests)
  const tasks = useStore((state) => state.tasks)
  const assignments = useStore((state) => state.assignments)

  const counterpart = () => {
    if (record.type === 'request') {
      const owner = requests.find((item) => item.request_id === record.id)?.user_id
      if (owner && owner !== userId) return owner
      return (owner ? getProfile(owner)?.reports_to : null) ?? users.find((user) => user.role === 'hr_admin' && user.user_id !== userId)?.user_id
    }
    if (record.type === 'task') {
      const task = tasks.find((item) => item.task_id === record.id)
      if (task && task.assigned_by !== userId) return task.assigned_by
      return assignments.find((item) => item.task_id === record.id && item.user_id !== userId)?.user_id
    }
    return users.find((user) => user.role === 'hr_admin' && user.user_id !== userId)?.user_id
  }

  const open = () => {
    const other = counterpart()
    if (!other) return toast.error(t('ms.discuss.none'))
    const room = openDirect(userId, other)
    const base = record.type === 'request' ? '/requests' : record.type === 'task' ? '/tasks' : '/employees'
    sendMessage(room, userId, t('rc.discuss.message', { kind: t(`ms.record.${record.type}`), id: record.id, link: `${base}/${record.id}` }))
    toast.success(t('ms.discuss.opened'))
    navigate(`/messages/${room}`)
  }

  return (
    <Button variant="secondary" icon={MessagesSquare} onClick={open}>
      {t('ms.discuss')}
    </Button>
  )
}
