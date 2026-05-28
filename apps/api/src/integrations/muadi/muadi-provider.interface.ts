export const MUADI_PROVIDER = Symbol('MUADI_PROVIDER');

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  paxAdt: number;
  paxChd: number;
  paxInf: number;
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
  fareInfo?: MuadiFareInfo[];
}

export interface MuadiRawFlight {
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
  rawFlights: MuadiRawFlight[];
  returnRawFlights?: MuadiRawFlight[];
  airlinesQueried: string[];
  airlinesFailed: MuadiAirlineFailure[];
}

export interface IMuadiProvider {
  search(params: SearchParams): Promise<SearchResult>;
}
