import { useQuery } from '@tanstack/react-query'
import { ACTIVE_HUNTS, HUNTS, DESTINATIONS, VOUCHERS } from './mock'
import type { ActiveHunt, Destination, Hunt, Voucher } from './mock'

export interface TodayTask {
  bookingId: string
  code: string
  remain: string
  route: string
  date: string
  pax: number
}

export interface HomeData {
  greetingName: string
  greeting: string
  activeHunts: ActiveHunt[]
  hunts: Hunt[]
  destinations: Destination[]
  vouchers: Voucher[]
  todayTask: TodayTask | null
}

// Mock-first stand-in for GET /me/dashboard. The artificial delay exercises the
// loading skeleton; swap the body for fetch() when the API is wired.
function fetchHomeDashboard(): Promise<HomeData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        greetingName: 'Andy',
        greeting: 'Chào buổi sáng, Andy',
        activeHunts: ACTIVE_HUNTS,
        hunts: HUNTS,
        destinations: DESTINATIONS,
        vouchers: VOUCHERS,
        todayTask: { bookingId: 'bk-002', code: 'OFY3M9', remain: '2g 14p', route: 'SGN → HUI', date: '28 thg 6', pax: 2 },
      })
    }, 600)
  })
}

export function useHomeData() {
  return useQuery({ queryKey: ['home-dashboard'], queryFn: fetchHomeDashboard })
}
