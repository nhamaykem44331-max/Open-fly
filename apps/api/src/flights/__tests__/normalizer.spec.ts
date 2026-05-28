import { MuadiRawFlight } from '../../integrations/muadi/muadi-provider.interface';
import {
  computeDuration,
  generateOfferId,
  normalizeFlight,
  parseDepartDate,
} from '../normalizer';

describe('flight normalizer', () => {
  it('normalizes a direct flight with a single fare class', () => {
    const offer = normalizeFlight(
      {
        airline: 'VN',
        routeInfo: [
          {
            carrierCode: 'VN',
            flightNumber: '247',
            from: 'SGN',
            to: 'HAN',
            departDate: '2026-06-15 08:00',
            arrivalDate: '2026-06-15 10:10',
          },
        ],
        priceInfo: [
          {
            fareClass: 'Eco',
            total: 1200000,
            soldOut: false,
            baggage: 23,
          },
        ],
      },
      'VN',
    );

    expect(offer.flightNumber).toBe('VN247');
    expect(offer.isDirect).toBe(true);
    expect(offer.cheapestPriceVnd).toBe(1200000);
    expect(offer.durationMinutes).toBe(130);
    expect(offer.fareClasses[0].name).toBe('Phổ thông');
  });

  it('normalizes a multi-segment flight with multiple fare classes', () => {
    const offer = normalizeFlight(
      {
        airline: 'QH',
        routeInfo: [
          {
            carrierCode: 'QH',
            flightNumber: '1201',
            from: 'SGN',
            to: 'DAD',
            departDate: '2026-06-15 09:20',
            arrivalDate: '2026-06-15 10:40',
          },
          {
            carrierCode: 'QH',
            flightNumber: '102',
            from: 'DAD',
            to: 'HAN',
            departDate: '2026-06-15 12:00',
            arrivalDate: '2026-06-15 13:20',
          },
        ],
        priceInfo: [
          {
            fareClass: 'Eco',
            total: 1090000,
            soldOut: false,
          },
          {
            fareClass: 'Plus',
            total: 1490000,
            soldOut: false,
          },
        ],
      },
      'QH',
    );

    expect(offer.isDirect).toBe(false);
    expect(offer.segments).toHaveLength(2);
    expect(offer.durationMinutes).toBe(160);
    expect(offer.fareClasses).toHaveLength(2);
  });

  it('falls back to top-level route fields when routeInfo is empty', () => {
    const offer = normalizeFlight(
      {
        airline: 'VJ',
        flightNumber: '137',
        from: 'SGN',
        to: 'HAN',
        departDateTime: '2026-06-15 12:10',
        arrivalDateTime: '2026-06-15 14:20',
        priceInfo: [
          {
            fareClass: 'Eco',
            total: 890000,
            soldOut: false,
          },
        ],
      },
      'VJ',
    );

    expect(offer.flightNumber).toBe('VJ137');
    expect(offer.segments[0].from.code).toBe('SGN');
    expect(offer.segments[0].to.code).toBe('HAN');
  });

  it('keeps sold-out fares but excludes them from cheapestPriceVnd', () => {
    const offer = normalizeFlight(
      {
        airline: 'BL',
        routeInfo: [
          {
            carrierCode: 'BL',
            flightNumber: '610',
            from: 'SGN',
            to: 'HAN',
            departDate: '2026-06-15 16:30',
            arrivalDate: '2026-06-15 18:40',
          },
        ],
        priceInfo: [
          {
            fareClass: 'Eco',
            total: 760000,
            soldOut: true,
          },
          {
            fareClass: 'Plus',
            total: 1180000,
            soldOut: false,
          },
        ],
      },
      'BL',
    );

    expect(offer.fareClasses[0].soldOut).toBe(true);
    expect(offer.cheapestPriceVnd).toBe(1180000);
  });

  it('parses Muadi local date strings and generates stable IDs', () => {
    const parsed = parseDepartDate('2026-06-15 08:00');
    const idA = generateOfferId('VN', 'VN247', parsed, 0);
    const idB = generateOfferId('VN', 'VN247', parsed, 0);

    expect(parsed).toBe('2026-06-15T01:00:00.000Z');
    expect(idA).toBe(idB);
  });

  it('computes duration by summing segments', () => {
    const raw: MuadiRawFlight = {
      airline: 'VN',
      routeInfo: [
        {
          carrierCode: 'VN',
          flightNumber: '247',
          from: 'SGN',
          to: 'HAN',
          departDate: '2026-06-15 08:00',
          arrivalDate: '2026-06-15 10:10',
        },
      ],
      priceInfo: [],
    };
    const offer = normalizeFlight(raw, 'VN');

    expect(computeDuration(offer.segments)).toBe(130);
  });
});
