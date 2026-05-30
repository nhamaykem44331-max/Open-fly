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
