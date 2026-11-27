import { todayRecord } from '@/features/attendance/data'
import { NEXA } from '@/features/messages/data'
import { useViewer } from '@/app/viewer-context'
import { useRc, type Presence } from './rc'

export function usePresenceOf() {
  const { userId } = useViewer()
  const status = useRc((state) => state.status)
  return (uid: number): Presence => {
    if (uid === NEXA) return 'online'
    const own = status[uid]
    if (own) return own.presence
    if (uid === userId) return 'online'
    const record = todayRecord(uid)
    return record?.check_in_time && !record.check_out_time ? 'online' : 'offline'
  }
}
