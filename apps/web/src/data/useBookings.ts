import { useQuery } from '@tanstack/react-query'
import { BOOKINGS } from './mock'
import type { Booking } from './mock'

// Mock-first stand-ins for GET /bookings and GET /bookings/:id.
export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => new Promise<Booking[]>((resolve) => setTimeout(() => resolve(BOOKINGS), 600)),
  })
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    enabled: !!id,
    queryFn: () => new Promise<Booking | undefined>((resolve) => setTimeout(() => resolve(BOOKINGS.find((b) => b.id === id)), 400)),
  })
}
