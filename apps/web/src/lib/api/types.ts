// OpenFly — backend API contract types (mirrors apps/api DTOs as of 2026-05-30).
// Prices from the API are FULL VND integers (Q-45); convert at the adapter boundary.

export interface ApiUser {
  id: string
  phone: string | null
  email: string | null
  googleEmail: string | null
  fullName: string | null
  role: string
  tier: string
  milesBalance: number
  avatarUrl: string | null
  language: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: ApiUser
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export interface ApiPlace {
  code: string
  city?: string
}

export interface ApiSegment {
  from: ApiPlace
  to: ApiPlace
  departTime: string // ISO 8601 with offset, e.g. "2026-06-15T16:40:00+07:00"
  arriveTime: string
  durationMinutes: number
  flightNumber: string
  aircraft?: string
}

export interface ApiFareClass {
  code: string
  name: string
  baseFareVnd: number
  taxesFeesVnd: number
  priceVnd: number
  seatAvailable: number
  soldOut: boolean
  refundable?: boolean
  baggage?: string
  baggageKg?: number
}

export interface ApiFlightOffer {
  id: string
  airline: { code: string; name: string }
  flightNumber: string
  segments: ApiSegment[]
  fareClasses: ApiFareClass[]
  cheapestPriceVnd: number
  durationMinutes: number
  isDirect: boolean
}

export interface ApiSearchParams {
  origin: string
  destination: string
  date: string // YYYY-MM-DD
  paxAdt: number
  paxChd: number
  paxInf: number
}

export interface ApiSearchResponse {
  query: ApiSearchParams
  offers: ApiFlightOffer[]
  returnOffers?: ApiFlightOffer[]
  airlinesQueried: string[]
  airlinesFailed: { airline: string; reason: string }[]
  cached: boolean
  fetchedAt: string
}

// ─── Fare Hunter ────────────────────────────────────────────
export type ApiHuntStatus = 'HUNTING' | 'FOUND' | 'PAUSED' | 'EXPIRED' | 'CANCELLED'
export type ApiHuntFlexibility =
  | 'EXACT_DATE'
  | 'DATE_RANGE'
  | 'WEEK_OF_MONTH'
  | 'WHOLE_MONTH'
  | 'ANY_DAY'

export interface ApiHunt {
  id: string
  userId: string
  status: ApiHuntStatus
  fromCode: string
  toCode: string
  flexibility: ApiHuntFlexibility
  windowStart: string
  windowEnd: string
  targetPrice: number // full VND (Q-45)
  bestPriceFound: number | null
  bestPriceDate: string | null
  pax: number
  cabin: string
  airlines: string[]
  channels: string[]
  intervalMinutes: number
  nextRunAt: string | null
  lastRunAt: string | null
  scansCount: number
  notifsSentCount: number
  autoHoldEnabled: boolean
  createdAt: string
  updatedAt: string
  // Backend TODO: GET /hunts should include ~12 recent cheapest prices (full VND,
  // oldest→newest) so the list sparkline has a data source. Optional until then.
  recentPrices?: number[]
}

export interface ApiHuntRun {
  id: string
  startedAt: string
  finishedAt: string | null
  cheapestPrice: number | null // full VND
  cheapestDate: string | null
  resultCount: number
  triggeredNotif: boolean
  error: string | null
}

export interface ApiHuntDetail extends ApiHunt {
  runs: ApiHuntRun[] // up to 30, ordered startedAt desc
}

export interface ApiHuntCreateResponse {
  id: string
  status: string
  fromCode: string
  toCode: string
  targetPrice: number
  intervalMinutes: number
  nextRunAt: string | null
}

// ─── Bookings / Trips ───────────────────────────────────────
// NOTE: booking datetimes are stored UTC and serialized with a trailing Z (e.g.
// "2026-06-15T00:25:00.000Z" = 07:25 +07) — convert to VN time, do NOT slice like search.
export type ApiBookingStatus =
  | 'DRAFT'
  | 'HELD'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PRICING_PENDING'
  | 'TICKETED'
  | 'ISSUE_FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED'

export interface ApiBookingListItem {
  id: string
  orderCode: string
  pnr: string | null
  status: ApiBookingStatus
  airline: string | null
  flightNumber: string | null
  aircraft: string | null
  fromCode: string
  toCode: string
  departTime: string
  arriveTime: string | null
  duration: string | null
  cabin: string
  totalSellPrice: number // full VND
  paymentDeadline: string | null
  createdAt: string
  passengers: { seatCode: string | null }[]
}

export interface ApiBookingListResponse {
  items: ApiBookingListItem[]
  pagination: { page: number; limit: number; total: number }
}

export interface ApiBookingPassenger {
  id: string
  fullName: string
  gender: string | null
  dob: string | null
  isChild: boolean
  cccd: string | null
  passport: string | null
  seatCode: string | null
  baggage: string | null
}

export interface ApiBookingPayment {
  id: string
  provider: string
  amount: number
  status: string
  paidAt: string | null
  transactionRef: string | null
}

export interface ApiBookingDetail {
  id: string
  orderCode: string
  pnr: string | null
  status: ApiBookingStatus
  airline: string | null
  flightNumber: string | null
  aircraft: string | null
  fromCode: string
  toCode: string
  departTime: string
  arriveTime: string | null
  duration: string | null
  cabin: string
  totalSellPrice: number // full VND
  tax: number
  fee: number
  addons: number
  voucherDiscount: number
  appliedVoucherCode: string | null
  paymentDeadline: string | null
  contactEmail: string
  contactPhone: string
  createdAt: string
  passengers: ApiBookingPassenger[]
  payments: ApiBookingPayment[]
}

// ─── Profile ────────────────────────────────────────────────
export interface ApiSavedPassenger {
  id: string
  fullName: string
  gender: string | null
  dob: string | null
  isChild: boolean
  cccd: string | null
  passport: string | null
  nationality: string | null
  isPrimary: boolean
}

export interface ApiNotifPrefs {
  pushEnabled: boolean
  telegramEnabled: boolean
  emailEnabled: boolean
  zaloEnabled: boolean
}

// ─── Notifications / Inbox ──────────────────────────────────
export interface ApiNotification {
  id: string
  kind: string // NotificationKind enum
  title: string
  body: string
  ctaUrl: string | null
  ctaLabel: string | null
  readAt: string | null
  huntId: string | null
  bookingId: string | null
  createdAt: string
}

export interface ApiNotificationListResponse {
  items: ApiNotification[]
  unreadCount: number
  pagination: { page: number; limit: number; total: number }
}
