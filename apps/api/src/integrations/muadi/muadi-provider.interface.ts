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
  flightNumber?: string;
  from?: string;
  to?: string;
  departDate?: string;
  arrivalDate?: string;
  aircraft?: string;
  duration?: string | number;
}

export interface MuadiRawFare {
  total?: number;
  soldOut?: boolean;
  fareClass?: string;
  fareBasis?: string;
  baggage?: string | number;
  refundable?: boolean;
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
