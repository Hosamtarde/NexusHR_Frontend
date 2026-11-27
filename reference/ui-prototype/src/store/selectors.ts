import { useMemo } from 'react'
import { useViewer } from '@/app/viewer-context'
import { reviewQueue } from '@/features/requests/data'
import { useUnreadChat } from '@/features/messages/rc/unread'
import { useStore } from '@/store'

export function usePendingApprovals() {
  const { role, userId } = useViewer()
  const requests = useStore((state) => state.requests)
  return useMemo(() => (role === 'employee' ? [] : reviewQueue(role, userId, requests)), [requests, role, userId])
}

export const useUnreadMessages = useUnreadChat
