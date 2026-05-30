import { useMutation } from '@tanstack/react-query'
import type { Flight, SavedPassenger } from './mock'
import { apiFetch } from '../lib/api/client'
import type { ApiHoldResponse } from '../lib/api/types'

export interface HoldInput {
  flight: Flight
  passengers: SavedPassenger[]
  email: string
  phone: string
}

function dobToIso(dob: string): string | undefined {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined
}

// Hold contact phone must be +84XXXXXXXXX — strip spaces/dashes the user typed.
const normalizePhone = (phone: string): string => phone.replace(/[^\d+]/g, '')

// View-model SavedPassenger → the hold API's passenger shape (title/first/last/type).
function toHoldPassenger(p: SavedPassenger) {
  const words = p.name.trim().split(/\s+/)
  const firstName = words.length > 1 ? words[words.length - 1] : p.name
  const lastName = words.length > 1 ? words.slice(0, -1).join(' ') : p.name
  const female = p.gender === 'Nữ'
  return {
    title: p.child ? (female ? 'MISS' : 'MSTR') : female ? 'MRS' : 'MR',
    firstName,
    lastName,
    type: p.child ? 'CHD' : 'ADT',
    dob: dobToIso(p.dob),
  }
}

// POST /bookings/hold with an Idempotency-Key (§5.6). Returns the held booking (bookingId etc).
export function useHoldBooking() {
  return useMutation({
    mutationFn: (input: HoldInput): Promise<ApiHoldResponse> =>
      apiFetch<ApiHoldResponse>('/bookings/hold', {
        method: 'POST',
        auth: true,
        idempotencyKey: crypto.randomUUID(),
        body: {
          offerId: input.flight.id,
          fareClass: input.flight.fareClassCode ?? '',
          passengers: input.passengers.map(toHoldPassenger),
          contact: { phone: normalizePhone(input.phone), email: input.email },
        },
      }),
  })
}
