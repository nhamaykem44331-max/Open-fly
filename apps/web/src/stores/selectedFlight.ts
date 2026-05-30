// OpenFly — the flight the user picked from results, threaded to detail/booking so the
// real offer id + fare-class code survive navigation. Offers are session-ephemeral, so this
// is intentionally NOT persisted (a refresh falls back to mock data / an error).
import { create } from 'zustand'
import type { Flight } from '../data/mock'

interface SelectedFlightState {
  flight: Flight | null
  select: (flight: Flight) => void
}

export const useSelectedFlight = create<SelectedFlightState>((set) => ({
  flight: null,
  select: (flight) => set({ flight }),
}))
