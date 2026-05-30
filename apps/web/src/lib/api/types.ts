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
