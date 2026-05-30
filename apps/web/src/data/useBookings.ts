import { useQuery } from '@tanstack/react-query'
import { BOOKINGS } from './mock'
import type { Booking } from './mock'
import { apiEnabled, apiFetch } from '../lib/api/client'
import { adaptBookingDetail, adaptBookingListItem } from '../lib/api/adapters'
import type { ApiBookingDetail, ApiBookingListResponse } from '../lib/api/types'

// DRAFT = abandoned/incomplete booking — hidden from the Trips list.
async function fetchBookingsApi(): Promise<Booking[]> {
  const res = await apiFetch<ApiBookingListResponse>('/bookings', { auth: true })
  return res.items.filter((b) => b.status !== 'DRAFT').map(adaptBookingListItem)
}

async function fetchBookingApi(id: string): Promise<Booking> {
  return adaptBookingDetail(await apiFetch<ApiBookingDetail>(`/bookings/${id}`, { auth: true }))
}

// GET /bookings and GET /bookings/:id — real API when enabled, mock otherwise (design mode).
export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () =>
      apiEnabled ? fetchBookingsApi() : new Promise<Booking[]>((resolve) => setTimeout(() => resolve(BOOKINGS), 600)),
  })
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    enabled: !!id,
    queryFn: () =>
      apiEnabled
        ? fetchBookingApi(id as string)
        : new Promise<Booking | undefined>((resolve) => setTimeout(() => resolve(BOOKINGS.find((b) => b.id === id)), 400)),
  })
}
