import { createHash } from 'crypto';
import {
  MuadiRawFare,
  MuadiRawFlight,
  MuadiRawSegment,
} from '../integrations/muadi/muadi-provider.interface';
import {
  FareClassDto,
  FlightOfferDto,
  FlightSegmentDto,
} from './dto/flight-offer.dto';

const AIRLINE_NAMES: Record<string, string> = {
  VN: 'Vietnam Airlines',
  VJ: 'Vietjet Air',
  QH: 'Bamboo Airways',
  BL: 'Pacific Airlines',
  VU: 'Vietravel Airlines',
};

const FARE_CLASS_NAMES: Record<string, string> = {
  Eco: 'Phổ thông',
  Economy: 'Phổ thông',
  Plus: 'Phổ thông linh hoạt',
  Business: 'Thương gia',
  Deluxe: 'Cao cấp',
  SkyBoss: 'SkyBoss',
};

export function normalizeFlight(
  rawFlight: MuadiRawFlight,
  airlineCode: string,
): FlightOfferDto {
  const normalizedAirline = (
    rawFlight.airline ??
    rawFlight.carrierCode ??
    airlineCode
  ).toUpperCase();
  const segments = buildSegments(rawFlight, normalizedAirline);
  const firstSegment = segments[0];
  const flightNumber =
    firstSegment?.flightNumber ??
    buildFlightNumber(normalizedAirline, rawFlight.flightNumber);
  const fareClasses = buildFareClasses(rawFlight.priceInfo ?? []);
  const offerFareIdx = getOfferFareIndex(fareClasses);

  return {
    id: generateOfferId(
      normalizedAirline,
      flightNumber,
      firstSegment?.departTime ?? '',
      offerFareIdx,
    ),
    airline: {
      code: normalizedAirline,
      name: AIRLINE_NAMES[normalizedAirline] ?? normalizedAirline,
    },
    flightNumber,
    segments,
    fareClasses,
    cheapestPriceVnd: getCheapestPrice(fareClasses),
    durationMinutes: computeDuration(segments),
    isDirect: segments.length === 1,
  };
}

export function parseDepartDate(rawDateStr: string): string {
  const trimmed = rawDateStr.trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    return new Date(`${withSeconds.replace(' ', 'T')}+07:00`).toISOString();
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Ngày giờ bay không hợp lệ: ${rawDateStr}`);
  }

  return parsed.toISOString();
}

export function computeDuration(segments: FlightSegmentDto[]): number {
  return segments.reduce(
    (total, segment) => total + segment.durationMinutes,
    0,
  );
}

export function generateOfferId(
  airline: string,
  flightNumber: string,
  departTime: string,
  fareIdx: number,
): string {
  return createHash('sha256')
    .update(`${airline}:${flightNumber}:${departTime}:${fareIdx}`)
    .digest('hex')
    .slice(0, 20);
}

function buildSegments(
  rawFlight: MuadiRawFlight,
  airlineCode: string,
): FlightSegmentDto[] {
  const routeInfo =
    rawFlight.routeInfo && rawFlight.routeInfo.length > 0
      ? rawFlight.routeInfo
      : [buildFallbackSegment(rawFlight)];

  return routeInfo.map((segment) =>
    normalizeSegment(segment, airlineCode, rawFlight),
  );
}

function buildFallbackSegment(rawFlight: MuadiRawFlight): MuadiRawSegment {
  return {
    carrierCode: rawFlight.carrierCode ?? rawFlight.airline,
    flightNumber: rawFlight.flightNumber,
    from: rawFlight.from,
    to: rawFlight.to,
    departDate: rawFlight.departDateTime ?? rawFlight.departDate,
    arrivalDate: rawFlight.arrivalDateTime ?? rawFlight.arrivalDate,
    aircraft: rawFlight.aircraft,
  };
}

function normalizeSegment(
  segment: MuadiRawSegment,
  airlineCode: string,
  rawFlight: MuadiRawFlight,
): FlightSegmentDto {
  const departTime = parseDepartDate(
    requiredDate(segment.departDate ?? rawFlight.departDateTime),
  );
  const arriveTime = parseDepartDate(
    requiredDate(segment.arrivalDate ?? rawFlight.arrivalDateTime),
  );

  return {
    from: {
      code: requiredAirport(segment.from ?? rawFlight.from),
    },
    to: {
      code: requiredAirport(segment.to ?? rawFlight.to),
    },
    departTime,
    arriveTime,
    durationMinutes: parseDuration(segment.duration, departTime, arriveTime),
    flightNumber: buildFlightNumber(
      segment.carrierCode ?? airlineCode,
      segment.flightNumber ?? rawFlight.flightNumber,
    ),
    aircraft: segment.aircraft ?? rawFlight.aircraft,
  };
}

function buildFareClasses(rawFares: MuadiRawFare[]): FareClassDto[] {
  return rawFares.map((fare, index) => {
    const code = fare.fareClass ?? fare.fareBasis ?? `Fare${index + 1}`;
    return {
      code,
      name: FARE_CLASS_NAMES[code] ?? code,
      priceVnd: fare.total ?? 0,
      soldOut: fare.soldOut ?? false,
      refundable: fare.refundable,
      baggageKg: parseBaggageKg(fare.baggage),
    };
  });
}

function getCheapestPrice(fareClasses: FareClassDto[]): number {
  const availablePrices = fareClasses
    .filter((fareClass) => !fareClass.soldOut && fareClass.priceVnd > 0)
    .map((fareClass) => fareClass.priceVnd);
  if (availablePrices.length > 0) {
    return Math.min(...availablePrices);
  }

  const allPrices = fareClasses
    .filter((fareClass) => fareClass.priceVnd > 0)
    .map((fareClass) => fareClass.priceVnd);

  return allPrices.length > 0 ? Math.min(...allPrices) : 0;
}

function getOfferFareIndex(fareClasses: FareClassDto[]): number {
  const availableIndexes = fareClasses
    .map((fareClass, index) => ({ fareClass, index }))
    .filter(({ fareClass }) => !fareClass.soldOut && fareClass.priceVnd > 0);
  if (availableIndexes.length === 0) {
    return 0;
  }

  return availableIndexes.reduce((cheapest, current) =>
    current.fareClass.priceVnd < cheapest.fareClass.priceVnd
      ? current
      : cheapest,
  ).index;
}

function parseDuration(
  rawDuration: string | number | undefined,
  departTime: string,
  arriveTime: string,
): number {
  if (typeof rawDuration === 'number' && Number.isFinite(rawDuration)) {
    return rawDuration;
  }

  if (typeof rawDuration === 'string') {
    const hourMinute = rawDuration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
    if (hourMinute && (hourMinute[1] || hourMinute[2])) {
      return Number(hourMinute[1] ?? 0) * 60 + Number(hourMinute[2] ?? 0);
    }

    const numeric = Number(rawDuration);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return Math.max(
    0,
    Math.round((Date.parse(arriveTime) - Date.parse(departTime)) / 60000),
  );
}

function parseBaggageKg(
  rawBaggage: string | number | undefined,
): number | undefined {
  if (typeof rawBaggage === 'number' && Number.isFinite(rawBaggage)) {
    return rawBaggage;
  }

  if (typeof rawBaggage === 'string') {
    const match = rawBaggage.match(/\d+/);
    if (match) {
      return Number(match[0]);
    }
  }

  return undefined;
}

function buildFlightNumber(
  carrierCode: string | undefined,
  flightNumber: string | undefined,
): string {
  const carrier = (carrierCode ?? '').toUpperCase();
  const number = flightNumber ?? '';
  if (!carrier) {
    return number;
  }
  if (number.toUpperCase().startsWith(carrier)) {
    return number.toUpperCase();
  }

  return `${carrier}${number}`;
}

function requiredAirport(value: string | undefined): string {
  if (!value) {
    throw new Error('Thiếu mã sân bay trong dữ liệu Muadi');
  }

  return value.toUpperCase();
}

function requiredDate(value: string | undefined): string {
  if (!value) {
    throw new Error('Thiếu ngày giờ bay trong dữ liệu Muadi');
  }

  return value;
}
