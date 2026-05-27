export const MUADI_PROVIDER = Symbol('MUADI_PROVIDER');

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  paxAdt: number;
  paxChd: number;
  paxInf: number;
}

export interface FlightOffer {
  offerId: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  price: {
    amount: number;
    currency: 'VND';
    unit: 'thousand';
  };
  seatsAvailable: number;
  refundable: boolean;
  baggageKg: number;
}

export interface SearchResult {
  provider: 'mock' | 'muadi';
  searchedAt: string;
  offers: FlightOffer[];
}

export interface IMuadiProvider {
  search(params: SearchParams): Promise<SearchResult>;
}
