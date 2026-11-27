import { useMemo } from 'react'
import { useViewer } from '@/app/viewer-context'
import { useStore } from '@/store'

export function useMyNotifications() {
  const { userId } = useViewer()
  const all = useStore((state) => state.notifications)
  return useMemo(() => {
    const items = all.filter((item) => item.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at))
    return { items, unread: items.filter((item) => !item.is_read).length }
  }, [all, userId])
}
