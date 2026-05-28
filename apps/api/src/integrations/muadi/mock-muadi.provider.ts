import { Injectable } from '@nestjs/common';
import {
  IMuadiProvider,
  MuadiRawFlight,
  SearchParams,
  SearchResult,
} from './muadi-provider.interface';

@Injectable()
export class MockMuadiProvider implements IMuadiProvider {
  async search(params: SearchParams): Promise<SearchResult> {
    return {
      provider: 'mock',
      searchedAt: new Date().toISOString(),
      rawFlights: buildMockFlights(params),
      airlinesQueried: ['VN', 'VJ', 'QH', 'BL'],
      airlinesFailed: [],
    };
  }
}

function buildMockFlights(params: SearchParams): MuadiRawFlight[] {
  return [
    {
      airline: 'VN',
      routeInfo: [
        {
          carrierCode: 'VN',
          flightNumber: '247',
          from: params.origin,
          to: params.destination,
          departDate: `${params.date} 08:00`,
          arrivalDate: `${params.date} 10:10`,
          aircraft: 'Airbus A321',
        },
      ],
      priceInfo: [
        {
          fareClass: 'Eco',
          total: 1280000,
          soldOut: false,
          baggage: 23,
          refundable: false,
        },
        {
          fareClass: 'Plus',
          total: 1680000,
          soldOut: false,
          baggage: 23,
          refundable: true,
        },
        {
          fareClass: 'Business',
          total: 3890000,
          soldOut: false,
          baggage: 32,
          refundable: true,
        },
      ],
    },
    {
      airline: 'VJ',
      routeInfo: [
        {
          carrierCode: 'VJ',
          flightNumber: '137',
          from: params.origin,
          to: params.destination,
          departDate: `${params.date} 12:10`,
          arrivalDate: `${params.date} 14:20`,
          aircraft: 'Airbus A320',
        },
      ],
      priceInfo: [
        {
          fareClass: 'Eco',
          total: 890000,
          soldOut: false,
          baggage: 7,
          refundable: false,
        },
        {
          fareClass: 'Deluxe',
          total: 1250000,
          soldOut: false,
          baggage: 20,
          refundable: false,
        },
      ],
    },
    {
      airline: 'QH',
      routeInfo: [
        {
          carrierCode: 'QH',
          flightNumber: '1201',
          from: params.origin,
          to: 'DAD',
          departDate: `${params.date} 09:20`,
          arrivalDate: `${params.date} 10:40`,
          aircraft: 'Airbus A320',
        },
        {
          carrierCode: 'QH',
          flightNumber: '102',
          from: 'DAD',
          to: params.destination,
          departDate: `${params.date} 12:00`,
          arrivalDate: `${params.date} 13:20`,
          aircraft: 'Airbus A320',
        },
      ],
      priceInfo: [
        {
          fareClass: 'Eco',
          total: 1090000,
          soldOut: false,
          baggage: 20,
          refundable: false,
        },
        {
          fareClass: 'Plus',
          total: 1490000,
          soldOut: false,
          baggage: 20,
          refundable: true,
        },
      ],
    },
    {
      airline: 'BL',
      routeInfo: [
        {
          carrierCode: 'BL',
          flightNumber: '610',
          from: params.origin,
          to: params.destination,
          departDate: `${params.date} 16:30`,
          arrivalDate: `${params.date} 18:40`,
          aircraft: 'Airbus A320',
        },
      ],
      priceInfo: [
        {
          fareClass: 'Eco',
          total: 760000,
          soldOut: true,
          baggage: 7,
          refundable: false,
        },
        {
          fareClass: 'Plus',
          total: 1180000,
          soldOut: false,
          baggage: 23,
          refundable: true,
        },
      ],
    },
    {
      airline: 'VN',
      routeInfo: [
        {
          carrierCode: 'VN',
          flightNumber: '251',
          from: params.origin,
          to: params.destination,
          departDate: `${params.date} 19:00`,
          arrivalDate: `${params.date} 21:10`,
          aircraft: 'Boeing 787',
        },
      ],
      priceInfo: [
        {
          fareClass: 'Eco',
          total: 1420000,
          soldOut: false,
          baggage: 23,
          refundable: false,
        },
        {
          fareClass: 'Business',
          total: 4200000,
          soldOut: false,
          baggage: 32,
          refundable: true,
        },
      ],
    },
  ];
}
