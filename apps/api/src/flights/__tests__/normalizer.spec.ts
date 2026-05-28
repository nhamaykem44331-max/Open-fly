import { MuadiRawFlight } from '../../integrations/muadi/muadi-provider.interface';
import {
  computeDuration,
  generateOfferId,
  normalizeFlight,
  parseMuadiDateTime,
} from '../normalizer';

describe('flight normalizer', () => {
  it('normalizes a direct production-shape flight and computes fare breakdown', () => {
    const offer = normalizeFlight(
      {
        airline: 'VN',
        issueFeeADT: 50000,
        routeInfo: [
          {
            carrierCode: 'VN',
            carrierName: 'Vietnam Airlines',
            flightNumber: '252',
            from: 'SGN',
            to: 'HAN',
            departureCity: 'Tp. Hồ Chí Minh',
            arrivalCity: 'Hà Nội',
            departDate: '11-06-2026 16:40',
            arrivalDate: '11-06-2026 18:50',
            flightTimeHour: 2,
            flightTimeMinute: 10,
            airCraft: '350',
          },
        ],
        priceInfo: [
          {
            class: 'L',
            seatAvailable: 9,
            fareADT: 2099000,
            taxADT: 569000,
            vatADT: 168000,
            fareInfo: [
              {
                class: 'L',
                cabinClass: 'Economy',
                baggageInformations: [
                  {
                    type: 'BAG',
                    pieces: 1,
                    description: '1 Pieces',
                  },
                ],
              },
            ],
            refundable: true,
          },
        ],
      },
      'VN',
    );

    expect(offer.airline.name).toBe('Vietnam Airlines');
    expect(offer.flightNumber).toBe('VN252');
    expect(offer.segments[0].from.city).toBe('Tp. Hồ Chí Minh');
    expect(offer.segments[0].to.city).toBe('Hà Nội');
    expect(offer.fareClasses[0]).toEqual(
      expect.objectContaining({
        code: 'L',
        name: 'Economy',
        baseFareVnd: 2099000,
        taxesFeesVnd: 787000,
        priceVnd: 2886000,
        seatAvailable: 9,
        soldOut: false,
        refundable: true,
        baggage: '1 Pieces',
      }),
    );
    expect(offer.cheapestPriceVnd).toBe(2886000);
    expect(offer.durationMinutes).toBe(130);
  });

  it('marks sold-out fares when seatAvailable is zero and excludes them from cheapest price', () => {
    const offer = normalizeFlight(
      {
        airline: 'BL',
        issueFeeADT: 35000,
        routeInfo: [
          {
            carrierCode: 'BL',
            flightNumber: '610',
            from: 'SGN',
            to: 'HAN',
            departDate: '11-06-2026 16:30',
            arrivalDate: '11-06-2026 18:40',
            flightTimeHour: 2,
            flightTimeMinute: 10,
          },
        ],
        priceInfo: [
          {
            class: 'Eco',
            seatAvailable: 0,
            fareADT: 680000,
            taxADT: 400000,
            vatADT: 68000,
          },
          {
            class: 'Plus',
            seatAvailable: 7,
            fareADT: 1080000,
            taxADT: 450000,
            vatADT: 108000,
          },
        ],
      },
      'BL',
    );

    expect(offer.fareClasses[0].soldOut).toBe(true);
    expect(offer.fareClasses[0].priceVnd).toBe(1183000);
    expect(offer.cheapestPriceVnd).toBe(1673000);
  });

  it('parses Muadi DD-MM-YYYY local date strings with Vietnam offset', () => {
    const parsed = parseMuadiDateTime('11-06-2026 16:40');
    const idA = generateOfferId('VN', 'VN252', parsed, 0);
    const idB = generateOfferId('VN', 'VN252', parsed, 0);

    expect(parsed).toBe('2026-06-11T16:40:00+07:00');
    expect(idA).toBe(idB);
  });

  it('normalizes multi-segment flights and sums Muadi segment durations', () => {
    const offer = normalizeFlight(
      {
        airline: 'QH',
        routeInfo: [
          {
            carrierCode: 'QH',
            flightNumber: '1201',
            from: 'SGN',
            to: 'DAD',
            departDate: '11-06-2026 09:20',
            arrivalDate: '11-06-2026 10:40',
            flightTimeHour: 1,
            flightTimeMinute: 20,
          },
          {
            carrierCode: 'QH',
            flightNumber: '102',
            from: 'DAD',
            to: 'HAN',
            departDate: '11-06-2026 12:00',
            arrivalDate: '11-06-2026 13:20',
            flightTimeHour: 1,
            flightTimeMinute: 20,
          },
        ],
        priceInfo: [
          {
            class: 'Economy',
            seatAvailable: 5,
            fareADT: 990000,
            taxADT: 430000,
            vatADT: 99000,
            issueFeeADT: 45000,
          },
        ],
      },
      'QH',
    );

    expect(offer.isDirect).toBe(false);
    expect(offer.segments).toHaveLength(2);
    expect(offer.durationMinutes).toBe(160);
    expect(computeDuration(offer.segments)).toBe(160);
  });

  it('uses the issue fee fallback chain: fare, flight, bookingFees, then zero', () => {
    expect(firstFarePrice({ fareIssueFee: 11111 })).toBe(116111);
    expect(firstFarePrice({ flightIssueFee: 22222 })).toBe(127222);
    expect(firstFarePrice({ bookingIssueFee: 33333 })).toBe(138333);
    expect(firstFarePrice({})).toBe(105000);
  });

  it('falls back to top-level route fields when routeInfo is empty', () => {
    const offer = normalizeFlight(
      {
        airline: 'VJ',
        flightNumber: '137',
        from: 'SGN',
        to: 'HAN',
        departDateTime: '11-06-2026 12:10',
        arrivalDateTime: '11-06-2026 14:20',
        priceInfo: [
          {
            class: 'Eco',
            seatAvailable: 3,
            fareADT: 790000,
            taxADT: 420000,
            vatADT: 79000,
          },
        ],
      },
      'VJ',
    );

    expect(offer.flightNumber).toBe('VJ137');
    expect(offer.segments[0].from.code).toBe('SGN');
    expect(offer.segments[0].to.code).toBe('HAN');
  });
});

function firstFarePrice(params: {
  fareIssueFee?: number;
  flightIssueFee?: number;
  bookingIssueFee?: number;
}): number {
  const raw: MuadiRawFlight = {
    airline: 'VN',
    issueFeeADT: params.flightIssueFee,
    bookingFees:
      params.bookingIssueFee === undefined
        ? undefined
        : [{ issueFeeADT: params.bookingIssueFee }],
    routeInfo: [
      {
        carrierCode: 'VN',
        flightNumber: '252',
        from: 'SGN',
        to: 'HAN',
        departDate: '11-06-2026 16:40',
        arrivalDate: '11-06-2026 18:50',
        flightTimeHour: 2,
        flightTimeMinute: 10,
      },
    ],
    priceInfo: [
      {
        class: 'L',
        seatAvailable: 9,
        fareADT: 100000,
        taxADT: 3000,
        vatADT: 2000,
        issueFeeADT: params.fareIssueFee,
      },
    ],
  };

  return normalizeFlight(raw, 'VN').fareClasses[0].priceVnd;
}
