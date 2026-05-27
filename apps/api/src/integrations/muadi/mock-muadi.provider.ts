import { Injectable } from '@nestjs/common';
import {
  FlightOffer,
  IMuadiProvider,
  SearchParams,
  SearchResult,
} from './muadi-provider.interface';

@Injectable()
export class MockMuadiProvider implements IMuadiProvider {
  async search(params: SearchParams): Promise<SearchResult> {
    return {
      provider: 'mock',
      searchedAt: new Date().toISOString(),
      offers: buildMockOffers(params),
    };
  }
}

function buildMockOffers(params: SearchParams): FlightOffer[] {
  return [
    {
      offerId: `mock-vn-${params.origin}-${params.destination}-${params.date}`,
      airline: 'VN',
      flightNumber: 'VN245',
      origin: params.origin,
      destination: params.destination,
      departureAt: `${params.date}T08:20:00+07:00`,
      arrivalAt: `${params.date}T10:30:00+07:00`,
      durationMinutes: 130,
      price: {
        amount: 1290,
        currency: 'VND',
        unit: 'thousand',
      },
      seatsAvailable: 7,
      refundable: true,
      baggageKg: 23,
    },
    {
      offerId: `mock-vj-${params.origin}-${params.destination}-${params.date}`,
      airline: 'VJ',
      flightNumber: 'VJ137',
      origin: params.origin,
      destination: params.destination,
      departureAt: `${params.date}T12:10:00+07:00`,
      arrivalAt: `${params.date}T14:20:00+07:00`,
      durationMinutes: 130,
      price: {
        amount: 890,
        currency: 'VND',
        unit: 'thousand',
      },
      seatsAvailable: 4,
      refundable: false,
      baggageKg: 7,
    },
    {
      offerId: `mock-qh-${params.origin}-${params.destination}-${params.date}`,
      airline: 'QH',
      flightNumber: 'QH203',
      origin: params.origin,
      destination: params.destination,
      departureAt: `${params.date}T18:45:00+07:00`,
      arrivalAt: `${params.date}T20:55:00+07:00`,
      durationMinutes: 130,
      price: {
        amount: 1040,
        currency: 'VND',
        unit: 'thousand',
      },
      seatsAvailable: 9,
      refundable: false,
      baggageKg: 20,
    },
  ];
}
