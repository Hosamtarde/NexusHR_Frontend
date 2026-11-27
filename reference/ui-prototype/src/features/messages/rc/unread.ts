import { useMemo } from 'react'
import { useViewer } from '@/app/viewer-context'
import { useStore } from '@/store'
import { unreadIn, useRc } from './rc'

export function useUnreadChat() {
  const { userId } = useViewer()
  const rooms = useRc((state) => state.rooms)
  const messages = useRc((state) => state.messages)
  const lastRead = useRc((state) => state.lastRead)
  const notifications = useStore((state) => state.notifications)
  return useMemo(() => {
    const own = rooms.filter((room) => room.members.includes(userId)).reduce((sum, room) => sum + unreadIn(messages, lastRead, room.id, userId).length, 0)
    return own + notifications.filter((item) => item.user_id === userId && !item.is_read).length
  }, [rooms, messages, lastRead, notifications, userId])
}

