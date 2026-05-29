export const MUADI_PROVIDER = Symbol('MUADI_PROVIDER');

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  paxAdt: number;
  paxChd: number;
  paxInf: number;
}

export interface SearchOptions {
  // 'hunter' = quét nền: chừa headroom session cho real-time (acquireForHunter).
  // 'realtime' (mặc định) = search/booking của khách: không giới hạn.
  priority?: 'hunter' | 'realtime';
}

// Ném khi quét nền không còn headroom session (đã chừa cho real-time).
// Caller (Hunter) bắt lỗi này để hoãn lượt quét, KHÔNG tính là thất bại.
export class NoHunterHeadroomError extends Error {
  constructor() {
    super('NO_HUNTER_HEADROOM');
    this.name = 'NoHunterHeadroomError';
  }
}

export interface MuadiRawSegment {
  carrierCode?: string;
  carrierName?: string;
  flightNumber?: string;
  from?: string;
  to?: string;
  departDate?: string;
  arrivalDate?: string;
  aircraft?: string;
  airCraft?: string;
  duration?: string | number;
  flightTime?: string | number;
  flightTimeHour?: number;
  flightTimeMinute?: number;
  departureCity?: string;
  arrivalCity?: string;
  startTerminal?: string;
  endTerminal?: string;
  marketingCarrier?: string;
  operatingCarrier?: string;
  operatingCarrierName?: string;
}

export interface MuadiBaggageInformation {
  type?: string;
  pieces?: number;
  description?: string;
}

export interface MuadiFareInfo {
  market?: string;
  class?: string;
  cabinClass?: string;
  fareBasis?: string;
  seatAvailable?: number;
  baggageInformations?: MuadiBaggageInformation[];
}

export interface MuadiBookingFee {
  issueFeeADT?: number;
  issueFeeCHD?: number;
  issueFeeINF?: number;
}

export interface MuadiRawFare {
  id?: string;
  total?: number;
  soldOut?: boolean;
  class?: string;
  fareClass?: string;
  fareBasis?: string;
  baggage?: string | number;
  seatAvailable?: number;
  fareADT?: number;
  taxADT?: number;
  vatADT?: number;
  fareCHD?: number;
  taxCHD?: number;
  vatCHD?: number;
  fareINF?: number;
  taxINF?: number;
  vatINF?: number;
  issueFeeADT?: number;
  refundable?: boolean;
  changeable?: boolean;
  currencyCode?: string;
  source?: string;
  typeOfBook?: string;
  fareInfo?: MuadiFareInfo[];
}

export interface MuadiRawFlight {
  id?: string;
  airline?: string;
  carrierCode?: string;
  flightNumber?: string;
  routeInfo?: MuadiRawSegment[];
  priceInfo?: MuadiRawFare[];
  from?: string;
  to?: string;
  departDateTime?: string;
  arrivalDateTime?: string;
  departDate?: string;
  arrivalDate?: string;
  aircraft?: string;
  source?: string;
  typeOfBook?: string;
  isNDC?: boolean;
  lowestFare?: number;
  numberOfStop?: number;
  issueFeeADT?: number;
  issueFeeCHD?: number;
  bookingFee?: MuadiBookingFee[];
  bookingFees?: MuadiBookingFee[];
}

export interface MuadiAirlineFailure {
  airline: string;
  reason: string;
}

export interface SearchResult {
  provider: 'mock' | 'muadi';
  searchedAt: string;
  muadiSessionId: number;
  rawFlights: MuadiRawFlight[];
  returnRawFlights?: MuadiRawFlight[];
  airlinesQueried: string[];
  airlinesFailed: MuadiAirlineFailure[];
}

export interface HoldOfferSnapshot {
  from: string;
  to: string;
  date: string;
  paxAdt: number;
  paxChd: number;
  paxInf: number;
  airline: string;
  flightNumber: string;
  departDate: string;
  fareClass: string;
  snapshotPriceVnd: number;
}

export interface HoldPnr {
  airline: string;
  pnr: string;
  status?: string;
  timelimit?: string;
  total?: number;
  message?: string;
  rawJson?: unknown;
}

export interface HoldPassengerInput {
  title: string;
  firstName: string;
  lastName: string;
  type: 'ADT' | 'CHD' | 'INF';
  dob?: string;
}

export interface HoldContactInput {
  phone: string;
  email: string;
}

export interface HoldPricingPnr {
  pnr: string;
  total: number;
  airline?: string;
  status?: string;
  timelimit?: string;
  rawJson?: unknown;
}

export interface HoldPricing {
  verified: true;
  source: 'booking/ticket-info-by-id' | 'management/list-booking-fallback';
  totalNetPrice: number;
  currency: string;
  byPnr: HoldPricingPnr[];
  syncedAt: string;
}

export interface HoldParams {
  snapshot: HoldOfferSnapshot;
  fareClass: string;
  passengers: HoldPassengerInput[];
  contact: HoldContactInput;
  username?: string;
}

export interface HoldResult {
  bookingResponse: unknown;
  ticketInfo: unknown;
  protectionVerified: boolean;
  pnrs: HoldPnr[];
  pricing: HoldPricing;
  flight: MuadiRawFlight;
  fare: MuadiRawFare;
  bookRequest: Record<string, unknown>;
  muadiSessionId: number;
  snapshotPriceVnd: number;
  priceChanged: boolean;
}

export interface IMuadiProvider {
  search(params: SearchParams, options?: SearchOptions): Promise<SearchResult>;
  hold(params: HoldParams): Promise<HoldResult>;
}
