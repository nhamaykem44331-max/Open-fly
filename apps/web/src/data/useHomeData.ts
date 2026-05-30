import { useQuery } from '@tanstack/react-query'
import { ACTIVE_HUNTS, HUNTS, DESTINATIONS, VOUCHERS } from './mock'
import type { ActiveHunt, Destination, Hunt, Voucher } from './mock'
import { apiEnabled, apiFetch } from '../lib/api/client'
import { adaptHunt, fmtDurationMin } from '../lib/api/adapters'
import { useAuthStore } from '../stores/auth'
import type { ApiBookingListItem, ApiBookingListResponse, ApiHunt, ApiUserVoucher, ApiVoucherList } from '../lib/api/types'

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

// ─── Mock (design mode, no VITE_API_URL) ────────────────────
function fetchHomeMock(): Promise<HomeData> {
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

// ─── API mode — composed client-side (no /me/dashboard endpoint) ─────
// Home assembles from already-wired endpoints: /hunts, /bookings, /vouchers, /me. Destinations
// are static (a marketing strip with no backend in Phase 1).

// Vietnamese given name = last word of the full name (e.g. "Nguyễn Văn An" → "An").
const givenName = (full: string | null | undefined): string => full?.trim().split(/\s+/).pop() || 'bạn'

function greetingFor(name: string): string {
  const h = new Date().getHours()
  const part = h < 11 ? 'Chào buổi sáng' : h < 13 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  return `${part}, ${name}`
}

// Full (adapted) Hunt → the lightweight ActiveHunt the Home strip renders. Ids match the full
// list so HomeDesktop can look the full hunt back up for its card.
function huntToActive(h: Hunt): ActiveHunt {
  return {
    id: h.id,
    from: h.from,
    to: h.to,
    window: h.windowShort,
    target: h.target,
    current: h.best,
    trend: h.trend30,
    status: h.status,
    foundDate: h.status === 'found' ? h.bestDate : undefined,
  }
}

// Booking/voucher datetimes are UTC (trailing Z) — shift +07 for VN-local parts.
const vnDate = (iso: string): Date => new Date(new Date(iso).getTime() + 7 * 3600 * 1000)
const vnShortDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const vn = vnDate(iso)
  return `${vn.getUTCDate()} thg ${vn.getUTCMonth() + 1}` // "28 thg 6"
}
const vnDayMonth = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const vn = vnDate(iso)
  return `${String(vn.getUTCDate()).padStart(2, '0')}/${String(vn.getUTCMonth() + 1).padStart(2, '0')}` // "30/06"
}

const homeVoucher = (uv: ApiUserVoucher): Voucher => ({
  code: uv.template.code,
  title: uv.template.title,
  expires: vnDayMonth(uv.template.validUntil),
})

// The single most urgent unpaid hold → the "today" task card (soonest deadline still ahead).
const TASK_STATUSES = new Set(['HELD', 'PAYMENT_PENDING'])
function deriveTodayTask(items: ApiBookingListItem[]): TodayTask | null {
  const now = Date.now()
  const pending = items
    .filter((b) => TASK_STATUSES.has(b.status) && b.paymentDeadline && new Date(b.paymentDeadline).getTime() > now)
    .sort((a, b) => new Date(a.paymentDeadline as string).getTime() - new Date(b.paymentDeadline as string).getTime())
  const b = pending[0]
  if (!b) return null
  const mins = Math.round((new Date(b.paymentDeadline as string).getTime() - now) / 60000)
  return {
    bookingId: b.id,
    code: b.pnr ?? b.orderCode,
    remain: fmtDurationMin(mins),
    route: `${b.fromCode} → ${b.toCode}`,
    date: vnShortDate(b.departTime),
    pax: b.passengers.length,
  }
}

async function fetchHomeApi(): Promise<HomeData> {
  const [apiHunts, bookings, vouchers] = await Promise.all([
    apiFetch<ApiHunt[]>('/hunts', { auth: true }),
    apiFetch<ApiBookingListResponse>('/bookings', { auth: true }),
    apiFetch<ApiVoucherList>('/vouchers', { auth: true }),
  ])
  const hunts = apiHunts.map(adaptHunt)
  const activeHunts = hunts.filter((h) => h.status === 'found' || h.status === 'hunting').map(huntToActive)
  const name = givenName(useAuthStore.getState().user?.fullName)
  return {
    greetingName: name,
    greeting: greetingFor(name),
    activeHunts,
    hunts,
    destinations: DESTINATIONS,
    vouchers: vouchers.mine.filter((v) => v.status === 'ACTIVE').map(homeVoucher),
    todayTask: deriveTodayTask(bookings.items),
  }
}

export function useHomeData() {
  return useQuery({ queryKey: ['home-dashboard'], queryFn: () => (apiEnabled ? fetchHomeApi() : fetchHomeMock()) })
}
