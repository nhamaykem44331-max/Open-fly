import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SAVED_PASSENGERS } from './mock'
import type { SavedPassenger } from './mock'
import { apiEnabled, apiFetch } from '../lib/api/client'
import { adaptSavedPassenger } from '../lib/api/adapters'
import type { ApiNotifPrefs, ApiSavedPassenger } from '../lib/api/types'

export const DEFAULT_PREFS: ApiNotifPrefs = {
  pushEnabled: true,
  telegramEnabled: false,
  emailEnabled: true,
  zaloEnabled: false,
}

export const tierLabel = (tier: string | undefined): string =>
  tier === 'PREMIUM' ? 'Premium' : tier === 'AGENT' ? 'Đại lý' : 'Tiêu chuẩn'

// GET /me/passengers → view-model SavedPassenger[] (real), or the mock set (design mode).
export function useSavedPassengers() {
  return useQuery({
    queryKey: ['passengers'],
    queryFn: async (): Promise<SavedPassenger[]> =>
      apiEnabled
        ? (await apiFetch<ApiSavedPassenger[]>('/me/passengers', { auth: true })).map(adaptSavedPassenger)
        : SAVED_PASSENGERS,
  })
}

// GET /me/notification-preferences (defaults when none / mock mode).
export function useNotifPrefs() {
  return useQuery({
    queryKey: ['notif-prefs'],
    queryFn: (): Promise<ApiNotifPrefs> =>
      apiEnabled ? apiFetch<ApiNotifPrefs>('/me/notification-preferences', { auth: true }) : Promise.resolve(DEFAULT_PREFS),
  })
}

// PATCH /me/notification-preferences — optimistic so the toggle flips instantly.
export function useUpdateNotifPrefs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<ApiNotifPrefs>): Promise<ApiNotifPrefs> =>
      apiEnabled
        ? apiFetch<ApiNotifPrefs>('/me/notification-preferences', { method: 'PATCH', auth: true, body: patch })
        : Promise.resolve({ ...DEFAULT_PREFS, ...patch }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ['notif-prefs'] })
      const prev = qc.getQueryData<ApiNotifPrefs>(['notif-prefs'])
      qc.setQueryData<ApiNotifPrefs>(['notif-prefs'], (old) => ({ ...(old ?? DEFAULT_PREFS), ...patch }))
      return { prev }
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notif-prefs'], ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['notif-prefs'] })
    },
  })
}
