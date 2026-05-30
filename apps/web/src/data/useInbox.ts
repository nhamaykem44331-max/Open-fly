import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { INBOX_ITEMS } from './mock'
import type { InboxItem } from './mock'
import { apiEnabled, apiFetch } from '../lib/api/client'
import { adaptNotification } from '../lib/api/adapters'
import type { ApiNotificationListResponse } from '../lib/api/types'

export interface InboxData {
  items: InboxItem[]
  unreadCount: number
}

async function fetchInboxApi(): Promise<InboxData> {
  const res = await apiFetch<ApiNotificationListResponse>('/notifications', { auth: true })
  return { items: res.items.map(adaptNotification), unreadCount: res.unreadCount }
}

const mockInbox = (): InboxData => ({ items: INBOX_ITEMS, unreadCount: INBOX_ITEMS.filter((x) => x.unread).length })

// GET /notifications — real API when enabled, mock otherwise (design mode).
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: (): Promise<InboxData> => (apiEnabled ? fetchInboxApi() : Promise.resolve(mockInbox())),
  })
}

const recount = (items: InboxItem[]): InboxData => ({ items, unreadCount: items.filter((x) => x.unread).length })

// POST /notifications/:id/read — optimistic.
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiEnabled ? apiFetch<{ id: string; read: boolean }>(`/notifications/${id}/read`, { method: 'POST', auth: true }) : Promise.resolve(null),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] })
      const prev = qc.getQueryData<InboxData>(['notifications'])
      if (prev) qc.setQueryData<InboxData>(['notifications'], recount(prev.items.map((x) => (x.id === id ? { ...x, unread: false } : x))))
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// POST /notifications/read-all — optimistic.
export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiEnabled ? apiFetch<{ updated: number }>('/notifications/read-all', { method: 'POST', auth: true }) : Promise.resolve(null),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] })
      const prev = qc.getQueryData<InboxData>(['notifications'])
      if (prev) qc.setQueryData<InboxData>(['notifications'], recount(prev.items.map((x) => ({ ...x, unread: false }))))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
