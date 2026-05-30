import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HUNTS } from './mock'
import type { Hunt } from './mock'
import { apiEnabled, apiFetch } from '../lib/api/client'
import { adaptHunt, adaptHuntDetail } from '../lib/api/adapters'
import type { ApiHunt, ApiHuntCreateResponse, ApiHuntDetail, ApiHuntFlexibility } from '../lib/api/types'

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

// ─── Create ─────────────────────────────────────────────────
export interface HuntFormValues {
  from: string
  to: string
  windowPreset: string // 'jun-w2' | 'jun-w3' | 'jun-all' | 'flex'
  targetK: number // "k" units; ×1000 = full VND (Q-45)
  freqHours: number // 1 | 2 | 4 | 8
  channels: string[]
}

const isoDay = (d: Date): string => d.toISOString().slice(0, 10) // YYYY-MM-DD

// The 4 design window presets → backend flexibility + a concrete ISO window.
// NOTE: the fixed presets are June-2026 demo windows (a property of the design form);
// 'flex' maps to the next 60 days from today.
function presetToWindow(preset: string): { flexibility: ApiHuntFlexibility; windowStart: string; windowEnd: string } {
  switch (preset) {
    case 'jun-w2':
      return { flexibility: 'DATE_RANGE', windowStart: '2026-06-08', windowEnd: '2026-06-14' }
    case 'jun-w3':
      return { flexibility: 'DATE_RANGE', windowStart: '2026-06-15', windowEnd: '2026-06-21' }
    case 'jun-all':
      return { flexibility: 'WHOLE_MONTH', windowStart: '2026-06-01', windowEnd: '2026-06-30' }
    default: {
      const now = new Date()
      return {
        flexibility: 'ANY_DAY',
        windowStart: isoDay(now),
        windowEnd: isoDay(new Date(now.getTime() + 60 * 86_400_000)),
      }
    }
  }
}

// POST /hunts with an Idempotency-Key (§5.6). Invalidates the list on success.
export function useCreateHunt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: HuntFormValues): Promise<ApiHuntCreateResponse> => {
      const win = presetToWindow(form.windowPreset)
      return apiFetch<ApiHuntCreateResponse>('/hunts', {
        method: 'POST',
        auth: true,
        idempotencyKey: crypto.randomUUID(),
        body: {
          fromCode: form.from,
          toCode: form.to,
          flexibility: win.flexibility,
          windowStart: win.windowStart,
          windowEnd: win.windowEnd,
          targetPrice: form.targetK * 1000,
          pax: 1,
          cabin: 'economy',
          channels: form.channels,
          intervalMinutes: form.freqHours * 60,
        },
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['hunts'] })
    },
  })
}

// PATCH /hunts/:id — pause / resume. Refetches the hunt + list on success.
export function useUpdateHunt(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (action: 'pause' | 'resume') =>
      apiFetch<ApiHunt>(`/hunts/${id}`, { method: 'PATCH', auth: true, body: { action } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['hunt', id] })
      void qc.invalidateQueries({ queryKey: ['hunts'] })
    },
  })
}

// DELETE /hunts/:id — soft-cancel (status CANCELLED). Refetches the list on success.
export function useCancelHunt(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<{ id: string; status: string }>(`/hunts/${id}`, { method: 'DELETE', auth: true }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['hunts'] })
    },
  })
}
