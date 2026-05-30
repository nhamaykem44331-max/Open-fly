// OpenFly — map backend API shapes onto the web's view models.
// CRITICAL: API prices are FULL VND (Q-45); the web's Price/fmtVnd components expect
// "k" units (value × 1000), so divide by 1000 here at the boundary — never downstream.
import type { Booking, BookingStatus, Flight, Hunt, HuntStatus, InboxItem, InboxKind, SavedPassenger } from '../../data/mock'
import type {
  ApiBookingDetail,
  ApiBookingListItem,
  ApiBookingPassenger,
  ApiBookingStatus,
  ApiFlightOffer,
  ApiHunt,
  ApiHuntDetail,
  ApiHuntFlexibility,
  ApiHuntStatus,
  ApiNotification,
  ApiSavedPassenger,
} from './types'

export const vndToK = (vnd: number): number => vnd / 1000

const hhmm = (iso: string): string => iso.slice(11, 16) // "...T16:40:00+07:00" → "16:40"

export const fmtDurationMin = (min: number): string => `${Math.floor(min / 60)}g ${min % 60}p`

const VI_DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
export function viDateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00+07:00`)
  if (Number.isNaN(d.getTime())) return date
  return `${VI_DOW[d.getDay()]}, ${d.getDate()} thg ${d.getMonth() + 1}`
}

const refundLabel = (refundable?: boolean): string =>
  refundable ? 'Có thể đổi/hoàn (theo điều kiện vé)' : 'Không hoàn, đổi có phí'

// One API offer → one web Flight. Uses the cheapest fare class for the price breakdown.
export function adaptOffer(offer: ApiFlightOffer, date: string): Flight {
  const first = offer.segments[0]
  const last = offer.segments[offer.segments.length - 1]
  const fare = offer.fareClasses[0]
  return {
    id: offer.id,
    airline: offer.airline.code,
    number: offer.flightNumber,
    aircraft: first?.aircraft || '—',
    depart: first ? hhmm(first.departTime) : '',
    arrive: last ? hhmm(last.arriveTime) : '',
    duration: fmtDurationMin(offer.durationMinutes),
    stops: offer.isDirect ? 0 : Math.max(0, offer.segments.length - 1),
    from: first?.from.code ?? '',
    to: last?.to.code ?? '',
    date,
    price: vndToK(offer.cheapestPriceVnd),
    basePrice: fare ? vndToK(fare.baseFareVnd) : vndToK(offer.cheapestPriceVnd),
    tax: fare ? vndToK(fare.taxesFeesVnd) : 0,
    fee: 0,
    cabin: fare?.name ?? 'Phổ thông',
    baggage: { carry: '7kg', check: fare?.baggage ?? '—' },
    refundable: refundLabel(fare?.refundable),
    insight: null,
  }
}

// ─── Fare Hunter ────────────────────────────────────────────
// VN-local date parts (handles the +07:00 offset regardless of runtime tz).
function vnParts(iso: string): { day: number; month: number; year: number } {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { day: 0, month: 0, year: 0 }
  const vn = new Date(d.getTime() + 7 * 3600 * 1000)
  return { day: vn.getUTCDate(), month: vn.getUTCMonth() + 1, year: vn.getUTCFullYear() }
}

const shortDate = (iso: string): string => {
  const p = vnParts(iso)
  return `${p.day} thg ${p.month}`
}

const daysAgo = (iso: string): number => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000))
}

// windowStart/windowEnd + flexibility → the view-model's window labels.
function formatWindow(flex: ApiHuntFlexibility, startIso: string, endIso: string): { window: string; windowShort: string } {
  const s = vnParts(startIso)
  const e = vnParts(endIso)
  if (flex === 'EXACT_DATE') return { window: `${s.day} thg ${s.month}, ${s.year}`, windowShort: `${s.day} thg ${s.month}` }
  if (flex === 'WHOLE_MONTH') return { window: `Cả tháng ${s.month}, ${s.year}`, windowShort: `Tháng ${s.month}` }
  if (flex === 'ANY_DAY') return { window: 'Bất cứ ngày nào', windowShort: 'Linh hoạt' }
  // DATE_RANGE / WEEK_OF_MONTH
  if (s.month === e.month) return { window: `${s.day} — ${e.day} thg ${s.month}, ${s.year}`, windowShort: `${s.day}—${e.day} thg ${s.month}` }
  return { window: `${s.day} thg ${s.month} — ${e.day} thg ${e.month}, ${e.year}`, windowShort: `${s.day} thg ${s.month}—${e.day} thg ${e.month}` }
}

const mapHuntStatus = (s: ApiHuntStatus): HuntStatus => (s === 'FOUND' ? 'found' : s === 'HUNTING' ? 'hunting' : 'paused')

// Rule-based trend note from real price points (NOT AI — Sol is off-AI in Phase 1, Q-59).
function trendNote(trend: number[]): { dir: 'up' | 'down' | 'flat'; text: string } {
  if (trend.length < 2) return { dir: 'flat', text: 'Chưa đủ dữ liệu để nhận định xu hướng — Sol đang tiếp tục theo dõi.' }
  const recent = trend.slice(-6)
  const first = recent[0]
  const lastV = recent[recent.length - 1]
  const pct = Math.round(((lastV - first) / first) * 100)
  if (lastV <= first * 0.97) return { dir: 'down', text: `Giá đang giảm gần đây — khoảng ${Math.abs(pct)}% qua các lần quét gần nhất.` }
  if (lastV >= first * 1.03) return { dir: 'up', text: `Giá đang nhích lên gần đây — khoảng ${pct}% qua các lần quét gần nhất.` }
  return { dir: 'flat', text: 'Giá đang khá ổn định qua các lần quét gần đây.' }
}

// One API hunt (list shape, no runs) → view-model Hunt.
export function adaptHunt(h: ApiHunt): Hunt {
  const trend30 = (h.recentPrices ?? []).map(vndToK)
  const { window, windowShort } = formatWindow(h.flexibility, h.windowStart, h.windowEnd)
  return {
    id: h.id,
    from: h.fromCode,
    to: h.toCode,
    window,
    windowShort,
    target: vndToK(h.targetPrice),
    best: vndToK(h.bestPriceFound ?? h.targetPrice),
    bestDate: h.bestPriceDate ? shortDate(h.bestPriceDate) : '',
    pax: h.pax,
    cabin: h.cabin,
    airlines: h.airlines,
    channels: h.channels,
    frequency: Math.max(1, Math.round(h.intervalMinutes / 60)),
    status: mapHuntStatus(h.status),
    createdDaysAgo: daysAgo(h.createdAt),
    scans: h.scansCount,
    notifSent: h.notifsSentCount,
    trend30,
    aiTrend: trendNote(trend30),
  }
}

// Detail shape (with runs) → view-model Hunt. trend30 comes from the runs' cheapest prices.
export function adaptHuntDetail(h: ApiHuntDetail): Hunt {
  const prices = h.runs
    .filter((r) => r.cheapestPrice != null)
    .map((r) => vndToK(r.cheapestPrice as number))
    .reverse() // runs are startedAt desc → chronological
  const trend30 = prices.length > 0 ? prices : [vndToK(h.bestPriceFound ?? h.targetPrice)]
  return { ...adaptHunt(h), trend30, aiTrend: trendNote(trend30) }
}

// ─── Bookings / Trips ───────────────────────────────────────
// Booking datetimes are UTC ("...Z"); convert to VN (+07) — never slice like search offers.
const vnHhmm = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const vn = new Date(d.getTime() + 7 * 3600 * 1000)
  return `${String(vn.getUTCHours()).padStart(2, '0')}:${String(vn.getUTCMinutes()).padStart(2, '0')}`
}

const vnDateLabel = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const vn = new Date(d.getTime() + 7 * 3600 * 1000)
  return `${VI_DOW[vn.getUTCDay()]}, ${vn.getUTCDate()} thg ${vn.getUTCMonth() + 1} · ${vn.getUTCFullYear()}`
}

const isoDate = (iso: string): string => {
  const p = vnParts(iso)
  return p.year ? `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}` : ''
}

const ddmmyyyy = (iso: string): string => {
  const p = vnParts(iso)
  return p.year ? `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year}` : '—'
}

const cabinLabel = (c: string): string =>
  c === 'business' ? 'Thương gia' : c === 'premium_economy' ? 'Phổ thông đặc biệt' : 'Phổ thông'

const providerLabel = (p: string): string => (p === 'SEPAY' ? 'SePay' : p)

const HOLD_STATUSES: ApiBookingStatus[] = ['HELD', 'PAYMENT_PENDING', 'PRICING_PENDING', 'ISSUE_FAILED']
const CANCELLED_STATUSES: ApiBookingStatus[] = ['CANCELLED', 'EXPIRED', 'REFUNDED', 'FAILED']

// 11 backend statuses → the 4 the UI models. PAID/TICKETED split by whether the flight has flown.
function mapBookingStatus(s: ApiBookingStatus, departIso: string): BookingStatus {
  if (HOLD_STATUSES.includes(s)) return 'holding'
  if (CANCELLED_STATUSES.includes(s)) return 'cancelled'
  return new Date(departIso).getTime() < Date.now() ? 'completed' : 'confirmed'
}

const paxInitials = (name: string): string => {
  const w = name.trim().split(/\s+/)
  return (w.length > 1 ? w[w.length - 1][0] + w[0][0] : name.slice(0, 2)).toUpperCase()
}

function adaptPassenger(p: ApiBookingPassenger, i: number): SavedPassenger {
  return {
    id: p.id,
    name: p.fullName,
    gender: p.gender ?? '',
    dob: p.dob ? ddmmyyyy(p.dob) : '—',
    cccd: p.cccd ?? '—',
    primary: i === 0,
    initials: paxInitials(p.fullName),
    child: p.isChild,
  }
}

// Slim list item → Booking. The card only reads route, times, status, pnr, pax count + seats;
// the rest is defaulted (full breakdown/passengers come from the detail endpoint).
export function adaptBookingListItem(b: ApiBookingListItem): Booking {
  const seats = b.passengers.map((p) => p.seatCode).filter((s): s is string => !!s)
  return {
    id: b.id,
    pnr: b.pnr ?? b.orderCode,
    flightId: '',
    airline: b.airline ?? '',
    number: b.flightNumber ?? '',
    aircraft: b.aircraft ?? '—',
    from: b.fromCode,
    to: b.toCode,
    date: isoDate(b.departTime),
    dateLabel: vnDateLabel(b.departTime),
    depart: vnHhmm(b.departTime),
    arrive: b.arriveTime ? vnHhmm(b.arriveTime) : '',
    duration: b.duration ?? '',
    pax: b.passengers.map((_, i) => ({ id: `${b.id}-p${i}`, name: '', gender: '', dob: '—', cccd: '—', primary: i === 0, initials: '' }) as SavedPassenger),
    seats,
    cabin: cabinLabel(b.cabin),
    baggage: { carry: '7kg', check: '—' },
    contact: { email: '', phone: '' },
    total: vndToK(b.totalSellPrice),
    basePrice: 0,
    tax: 0,
    fee: 0,
    payment: { method: '', last4: '', paidAt: '' },
    status: mapBookingStatus(b.status, b.departTime),
    holdExpiresAt: b.paymentDeadline ? `giữ đến ${vnHhmm(b.paymentDeadline)}` : undefined,
  }
}

// Full detail → Booking (e-ticket / boarding pass). Money is full VND → "k" at the boundary.
export function adaptBookingDetail(b: ApiBookingDetail): Booking {
  const paid = b.payments.find((p) => p.status === 'PAID') ?? b.payments[0]
  const baseVnd = b.totalSellPrice - b.tax - b.fee - b.addons + b.voucherDiscount
  return {
    id: b.id,
    pnr: b.pnr ?? b.orderCode,
    flightId: '',
    airline: b.airline ?? '',
    number: b.flightNumber ?? '',
    aircraft: b.aircraft ?? '—',
    from: b.fromCode,
    to: b.toCode,
    date: isoDate(b.departTime),
    dateLabel: vnDateLabel(b.departTime),
    depart: vnHhmm(b.departTime),
    arrive: b.arriveTime ? vnHhmm(b.arriveTime) : '',
    duration: b.duration ?? '',
    pax: b.passengers.map(adaptPassenger),
    seats: b.passengers.map((p) => p.seatCode ?? '—'),
    cabin: cabinLabel(b.cabin),
    baggage: { carry: '7kg', check: b.passengers[0]?.baggage ?? '—' },
    contact: { email: b.contactEmail, phone: b.contactPhone },
    total: vndToK(b.totalSellPrice),
    basePrice: vndToK(baseVnd),
    tax: vndToK(b.tax),
    fee: vndToK(b.fee),
    addons: b.addons ? vndToK(b.addons) : undefined,
    voucher: b.appliedVoucherCode ? { code: b.appliedVoucherCode, name: b.appliedVoucherCode, value: -vndToK(b.voucherDiscount) } : undefined,
    payment:
      paid && paid.status === 'PAID'
        ? { method: providerLabel(paid.provider), last4: '', paidAt: paid.paidAt ? `${vnParts(paid.paidAt).day} thg ${vnParts(paid.paidAt).month} · ${vnHhmm(paid.paidAt)}` : '' }
        : { method: '', last4: '', paidAt: '' },
    status: mapBookingStatus(b.status, b.departTime),
    checkinOpensAt: 'trước chuyến bay 24 giờ',
    holdExpiresAt: b.paymentDeadline ? `giữ đến ${vnHhmm(b.paymentDeadline)}` : undefined,
  }
}

// ─── Profile ────────────────────────────────────────────────
export function adaptSavedPassenger(p: ApiSavedPassenger): SavedPassenger {
  return {
    id: p.id,
    name: p.fullName,
    gender: p.gender ?? '',
    dob: p.dob ? ddmmyyyy(p.dob) : '—',
    cccd: p.cccd ?? '—',
    primary: p.isPrimary,
    initials: paxInitials(p.fullName),
    child: p.isChild,
  }
}

// ─── Notifications / Inbox ──────────────────────────────────
const NOTIF_KIND: Record<string, InboxKind> = {
  HUNT_FOUND: 'hunt-found',
  HUNT_PROGRESS: 'price',
  PRICE_DROP: 'price',
  BOOKING_CONFIRMED: 'booking',
  BOOKING_TICKETED: 'booking',
  BOOKING_REMINDER: 'booking',
  PAYMENT_SUCCESS: 'booking',
  PAYMENT_FAILED: 'booking',
  CHECKIN_OPEN: 'checkin',
  SOL_MESSAGE: 'sol',
  VOUCHER_NEW: 'voucher',
  SYSTEM: 'sol',
}

// VN calendar-day index (days since epoch, shifted +07) — drives today/earlier grouping.
const vnDayNumber = (ms: number): number => Math.floor((ms + 7 * 3600 * 1000) / 86_400_000)

function notifWhen(iso: string): { group: 'today' | 'earlier'; when: string } {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return { group: 'earlier', when: '' }
  const days = vnDayNumber(Date.now()) - vnDayNumber(t)
  if (days <= 0) return { group: 'today', when: vnHhmm(iso) }
  if (days === 1) return { group: 'earlier', when: `Hôm qua · ${vnHhmm(iso)}` }
  return { group: 'earlier', when: `${days} ngày trước` }
}

export function adaptNotification(n: ApiNotification): InboxItem {
  const { group, when } = notifWhen(n.createdAt)
  return {
    id: n.id,
    group,
    when,
    unread: n.readAt === null,
    kind: NOTIF_KIND[n.kind] ?? 'sol',
    title: n.title,
    body: n.body,
    cta: n.ctaUrl && n.ctaLabel ? { label: n.ctaLabel, href: n.ctaUrl } : undefined,
  }
}
