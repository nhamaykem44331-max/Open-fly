import { Injectable } from '@nestjs/common';
import {
  HoldParams,
  HoldResult,
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

  async hold(params: HoldParams): Promise<HoldResult> {
    const timelimit = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    const pnr = {
      airline: 'VN',
      pnr: 'OFMOCK',
      status: 'HELD',
      timelimit,
      rawJson: {
        airline: 'VN',
        pnr: 'OFMOCK',
        status: 'HELD',
        timelimit,
      },
    };

    return {
      bookingResponse: {
        success: true,
        data: {
          sessionID: params.sessionId,
        },
      },
      ticketInfo: {
        success: true,
        data: {
          listPNR: [pnr.rawJson],
        },
      },
      protectionVerified: false,
      pnrs: [pnr],
    };
  }
}

function buildMockFlights(params: SearchParams): MuadiRawFlight[] {
  return [
    {
      airline: 'VN',
      from: params.origin,
      to: params.destination,
      issueFeeADT: 50000,
      routeInfo: [
        segment({
          airline: 'VN',
          flightNumber: '252',
          from: params.origin,
          to: params.destination,
          depart: dateTime(params.date, '16:40'),
          arrive: dateTime(params.date, '18:50'),
          carrierName: 'Vietnam Airlines',
          fromCity: 'Tp. Hồ Chí Minh',
          toCity: 'Hà Nội',
          aircraft: '350',
          durationHour: 2,
          durationMinute: 10,
        }),
      ],
      priceInfo: [
        fare({
          code: 'L',
          fareADT: 2099000,
          taxADT: 569000,
          vatADT: 168000,
          issueFeeADT: 50000,
          seatAvailable: 9,
          cabinClass: 'Economy',
          baggage: '1 Pieces',
          refundable: true,
        }),
        fare({
          code: 'B',
          fareADT: 3099000,
          taxADT: 619000,
          vatADT: 248000,
          issueFeeADT: 50000,
          seatAvailable: 4,
          cabinClass: 'Business',
          baggage: '2 Pieces',
          refundable: true,
        }),
      ],
    },
    {
      airline: 'VJ',
      from: params.origin,
      to: params.destination,
      issueFeeADT: 40000,
      routeInfo: [
        segment({
          airline: 'VJ',
          flightNumber: '137',
          from: params.origin,
          to: params.destination,
          depart: dateTime(params.date, '12:10'),
          arrive: dateTime(params.date, '14:20'),
          carrierName: 'Vietjet Air',
          fromCity: 'Tp. Hồ Chí Minh',
          toCity: 'Hà Nội',
          aircraft: '320',
          durationHour: 2,
          durationMinute: 10,
        }),
      ],
      priceInfo: [
        fare({
          code: 'Eco',
          fareADT: 790000,
          taxADT: 420000,
          vatADT: 79000,
          seatAvailable: 6,
          cabinClass: 'Economy',
          baggage: '7kg xách tay',
          refundable: false,
        }),
        fare({
          code: 'Deluxe',
          fareADT: 1190000,
          taxADT: 460000,
          vatADT: 119000,
          seatAvailable: 3,
          cabinClass: 'Deluxe',
          baggage: '20kg ký gửi',
          refundable: false,
        }),
      ],
    },
    {
      airline: 'QH',
      from: params.origin,
      to: params.destination,
      bookingFees: [{ issueFeeADT: 45000 }],
      routeInfo: [
        segment({
          airline: 'QH',
          flightNumber: '1201',
          from: params.origin,
          to: 'DAD',
          depart: dateTime(params.date, '09:20'),
          arrive: dateTime(params.date, '10:40'),
          carrierName: 'Bamboo Airways',
          fromCity: 'Tp. Hồ Chí Minh',
          toCity: 'Đà Nẵng',
          aircraft: '320',
          durationHour: 1,
          durationMinute: 20,
        }),
        segment({
          airline: 'QH',
          flightNumber: '102',
          from: 'DAD',
          to: params.destination,
          depart: dateTime(params.date, '12:00'),
          arrive: dateTime(params.date, '13:20'),
          carrierName: 'Bamboo Airways',
          fromCity: 'Đà Nẵng',
          toCity: 'Hà Nội',
          aircraft: '320',
          durationHour: 1,
          durationMinute: 20,
        }),
      ],
      priceInfo: [
        fare({
          code: 'Economy',
          fareADT: 990000,
          taxADT: 430000,
          vatADT: 99000,
          seatAvailable: 5,
          cabinClass: 'Economy',
          baggage: '1 Pieces',
          refundable: false,
        }),
        fare({
          code: 'Plus',
          fareADT: 1390000,
          taxADT: 470000,
          vatADT: 139000,
          seatAvailable: 2,
          cabinClass: 'Economy',
          baggage: '1 Pieces',
          refundable: true,
        }),
      ],
    },
    {
      airline: 'BL',
      from: params.origin,
      to: params.destination,
      issueFeeADT: 35000,
      routeInfo: [
        segment({
          airline: 'BL',
          flightNumber: '610',
          from: params.origin,
          to: params.destination,
          depart: dateTime(params.date, '16:30'),
          arrive: dateTime(params.date, '18:40'),
          carrierName: 'Pacific Airlines',
          fromCity: 'Tp. Hồ Chí Minh',
          toCity: 'Hà Nội',
          aircraft: '320',
          durationHour: 2,
          durationMinute: 10,
        }),
      ],
      priceInfo: [
        fare({
          code: 'Eco',
          fareADT: 680000,
          taxADT: 400000,
          vatADT: 68000,
          seatAvailable: 0,
          cabinClass: 'Economy',
          baggage: '7kg xách tay',
          refundable: false,
        }),
        fare({
          code: 'Plus',
          fareADT: 1080000,
          taxADT: 450000,
          vatADT: 108000,
          seatAvailable: 7,
          cabinClass: 'Economy',
          baggage: '1 Pieces',
          refundable: true,
        }),
      ],
    },
  ];
}

function segment(params: {
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  carrierName: string;
  fromCity: string;
  toCity: string;
  aircraft: string;
  durationHour: number;
  durationMinute: number;
}) {
  return {
    from: params.from,
    to: params.to,
    flightTimeHour: params.durationHour,
    flightTimeMinute: params.durationMinute,
    departDate: params.depart,
    arrivalDate: params.arrive,
    airCraft: params.aircraft,
    flightNumber: params.flightNumber,
    carrierCode: params.airline,
    carrierName: params.carrierName,
    departureCity: params.fromCity,
    arrivalCity: params.toCity,
  };
}

function fare(params: {
  code: string;
  fareADT: number;
  taxADT: number;
  vatADT: number;
  issueFeeADT?: number;
  seatAvailable: number;
  cabinClass: string;
  baggage: string;
  refundable: boolean;
}) {
  return {
    class: params.code,
    seatAvailable: params.seatAvailable,
    fareADT: params.fareADT,
    taxADT: params.taxADT,
    vatADT: params.vatADT,
    issueFeeADT: params.issueFeeADT,
    fareInfo: [
      {
        class: params.code,
        cabinClass: params.cabinClass,
        seatAvailable: params.seatAvailable,
        baggageInformations: [
          {
            type: 'BAG',
            description: params.baggage,
          },
        ],
      },
    ],
    refundable: params.refundable,
    changeable: params.refundable,
    currencyCode: 'VND',
  };
}

function dateTime(isoDate: string, time: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year} ${time}`;
}
