// OpenFly — booking-form selections threaded from passenger step → review (mobile is 2-step,
// the hold POST happens on the review CTA). Not persisted (a refresh restarts the booking).
import { create } from 'zustand'
import type { SavedPassenger } from '../data/mock'

interface BookingFormState {
  passengers: SavedPassenger[]
  email: string
  phone: string
  set: (v: Partial<Pick<BookingFormState, 'passengers' | 'email' | 'phone'>>) => void
}

export const useBookingForm = create<BookingFormState>((setState) => ({
  passengers: [],
  email: '',
  phone: '',
  set: (v) => setState(v),
}))
