import { useQuery } from '@tanstack/react-query'
import { HUNTS } from './mock'
import type { Hunt } from './mock'
import { apiEnabled, apiFetch } from '../lib/api/client'
import { adaptHunt, adaptHuntDetail } from '../lib/api/adapters'
import type { ApiHunt, ApiHuntDetail } from '../lib/api/types'

// EXPIRED/CANCELLED hunts are hidden from the list (only active states shown).
const LIST_STATUSES = new Set(['HUNTING', 'FOUND', 'PAUSED'])

async function fetchHuntsApi(): Promise<Hunt[]> {
  const hunts = await apiFetch<ApiHunt[]>('/hunts', { auth: true })
  return hunts.filter((h) => LIST_STATUSES.has(h.status)).map(adaptHunt)
}

async function fetchHuntApi(id: string): Promise<Hunt> {
  return adaptHuntDetail(await apiFetch<ApiHuntDetail>(`/hunts/${id}`, { auth: true }))
}

// GET /hunts and GET /hunts/:id — real API when enabled, mock otherwise (design mode).
export function useHunts() {
  return useQuery({
    queryKey: ['hunts'],
    queryFn: () =>
      apiEnabled ? fetchHuntsApi() : new Promise<Hunt[]>((resolve) => setTimeout(() => resolve(HUNTS), 600)),
  })
}

export function useHunt(id: string | undefined) {
  return useQuery({
    queryKey: ['hunt', id],
    enabled: !!id,
    queryFn: () =>
      apiEnabled
        ? fetchHuntApi(id as string)
        : new Promise<Hunt | undefined>((resolve) => setTimeout(() => resolve(HUNTS.find((h) => h.id === id)), 500)),
  })
}
