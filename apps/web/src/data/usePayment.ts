import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api/client'
import type { ApiPaymentStatus, ApiSepayIntent } from '../lib/api/types'

// POST /bookings/:id/payment/sepay (Public). Idempotency-keyed per booking so a re-mount
// reuses the same intent rather than spawning a new QR. Created once, then cached.
export function useSepayIntent(bookingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['sepay-intent', bookingId],
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: () =>
      apiFetch<ApiSepayIntent>(`/bookings/${bookingId}/payment/sepay`, {
        method: 'POST',
        idempotencyKey: `${bookingId}-sepay-intent`,
      }),
  })
}

// Backend-confirmed paid states — payment success is driven by this, never by a button.
const PAID_STATES = new Set(['PAID', 'TICKETED'])
export const isPaid = (status: string | null | undefined): boolean => !!status && PAID_STATES.has(status)

// GET /bookings/:id/payment/status (Public). Polls every 4s until the booking reads PAID.
export function usePaymentStatus(bookingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['payment-status', bookingId],
    enabled,
    refetchInterval: (query) => (isPaid(query.state.data?.bookingStatus) ? false : 4000),
    queryFn: () => apiFetch<ApiPaymentStatus>(`/bookings/${bookingId}/payment/status`),
  })
}
