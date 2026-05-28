import { createHash } from 'crypto';
import {
  MuadiBookingFee,
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
  Economy: 'Phổ thông',
  Business: 'Thương gia',
  Deluxe: 'Cao cấp',
  SkyBoss: 'SkyBoss',
};

export function normalizeFlight(
  rawFlight: MuadiRawFlight,
  airlineCode: string,
): FlightOfferDto {
  const normalizedAirline = getAirlineCode(rawFlight, airlineCode);
  const segments = buildSegments(rawFlight, normalizedAirline);
  const firstSegment = segments[0];
  const flightNumber =
    firstSegment?.flightNumber ??
    buildFlightNumber(normalizedAirline, rawFlight.flightNumber);
  const fareClasses = buildFareClasses(rawFlight);
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
      name: getAirlineName(rawFlight, normalizedAirline),
    },
    flightNumber,
    segments,
    fareClasses,
    cheapestPriceVnd: getCheapestPrice(fareClasses),
    durationMinutes: computeDuration(segments),
    isDirect: segments.length === 1,
  };
}

export function parseMuadiDateTime(rawDateStr: string): string {
  const trimmed = rawDateStr.trim();
  const muadiMatch = trimmed.match(
    /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (muadiMatch) {
    const [, day, month, year, hour, minute, second = '00'] = muadiMatch;
    return buildVietnamOffsetIso(year, month, day, hour, minute, second);
  }

  const legacyMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (legacyMatch) {
    const [, year, month, day, hour, minute, second = '00'] = legacyMatch;
    return buildVietnamOffsetIso(year, month, day, hour, minute, second);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Ngày giờ bay không hợp lệ: ${rawDateStr}`);
  }

  return parsed.toISOString();
}

export const parseDepartDate = parseMuadiDateTime;

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
  const departTime = parseMuadiDateTime(
    requiredDate(segment.departDate ?? rawFlight.departDateTime),
  );
  const arriveTime = parseMuadiDateTime(
    requiredDate(segment.arrivalDate ?? rawFlight.arrivalDateTime),
  );

  return {
    from: {
      code: requiredAirport(segment.from ?? rawFlight.from),
      city: segment.departureCity,
    },
    to: {
      code: requiredAirport(segment.to ?? rawFlight.to),
      city: segment.arrivalCity,
    },
    departTime,
    arriveTime,
    durationMinutes: getSegmentDuration(segment, departTime, arriveTime),
    flightNumber: buildFlightNumber(
      segment.carrierCode ?? airlineCode,
      segment.flightNumber ?? rawFlight.flightNumber,
    ),
    aircraft: segment.airCraft ?? segment.aircraft ?? rawFlight.aircraft,
  };
}

function buildFareClasses(rawFlight: MuadiRawFlight): FareClassDto[] {
  return (rawFlight.priceInfo ?? []).map((fare, index) => {
    const fareInfo = fare.fareInfo?.[0];
    const code =
      fare.class ??
      fare.fareClass ??
      fareInfo?.class ??
      fare.fareBasis ??
      `Fare${index + 1}`;
    const baseFareVnd = getFiniteNumber(fare.fareADT) ?? fare.total ?? 0;
    const issueFeeVnd = getIssueFeeVnd(fare, rawFlight);
    const taxesFeesVnd =
      (getFiniteNumber(fare.taxADT) ?? 0) +
      (getFiniteNumber(fare.vatADT) ?? 0) +
      issueFeeVnd;
    const priceVnd =
      getFiniteNumber(fare.fareADT) !== null
        ? baseFareVnd + taxesFeesVnd
        : (getFiniteNumber(fare.total) ?? baseFareVnd + taxesFeesVnd);
    const seatAvailable = getSeatAvailable(fare);
    const soldOut = fare.soldOut === true || seatAvailable <= 0;

    return {
      code,
      name: fareInfo?.cabinClass ?? FARE_CLASS_NAMES[code] ?? code,
      baseFareVnd,
      taxesFeesVnd,
      priceVnd,
      seatAvailable,
      soldOut,
      refundable: fare.refundable,
      baggage: getBaggage(fare),
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

function getSegmentDuration(
  segment: MuadiRawSegment,
  departTime: string,
  arriveTime: string,
): number {
  const hour = getFiniteNumber(segment.flightTimeHour);
  const minute = getFiniteNumber(segment.flightTimeMinute);
  if (hour !== null || minute !== null) {
    return (hour ?? 0) * 60 + (minute ?? 0);
  }

  return parseDuration(segment.duration, departTime, arriveTime);
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

function getAirlineCode(rawFlight: MuadiRawFlight, airlineCode: string): string {
  const firstSegment = rawFlight.routeInfo?.[0];
  return (
    rawFlight.airline ??
    rawFlight.carrierCode ??
    firstSegment?.carrierCode ??
    airlineCode
  ).toUpperCase();
}

function getAirlineName(rawFlight: MuadiRawFlight, airlineCode: string): string {
  const segmentName = rawFlight.routeInfo?.find(
    (segment) => segment.carrierName,
  )?.carrierName;

  return segmentName ?? AIRLINE_NAMES[airlineCode] ?? airlineCode;
}

function getIssueFeeVnd(
  fare: MuadiRawFare,
  rawFlight: MuadiRawFlight,
): number {
  const fareIssueFee = getFiniteNumber(fare.issueFeeADT);
  if (fareIssueFee !== null) {
    return fareIssueFee;
  }

  const flightIssueFee = getFiniteNumber(rawFlight.issueFeeADT);
  if (flightIssueFee !== null) {
    return flightIssueFee;
  }

  const bookingFees: MuadiBookingFee[] = [
    ...(rawFlight.bookingFee ?? []),
    ...(rawFlight.bookingFees ?? []),
  ];
  const bookingIssueFee = bookingFees
    .map((fee) => getFiniteNumber(fee.issueFeeADT))
    .find((value) => value !== null);

  return bookingIssueFee ?? 0;
}

function getSeatAvailable(fare: MuadiRawFare): number {
  const fareSeat = getFiniteNumber(fare.seatAvailable);
  if (fareSeat !== null) {
    return fareSeat;
  }

  const fareInfoSeat = getFiniteNumber(fare.fareInfo?.[0]?.seatAvailable);
  if (fareInfoSeat !== null) {
    return fareInfoSeat;
  }

  return fare.soldOut === true ? 0 : 1;
}

function getBaggage(fare: MuadiRawFare): string | undefined {
  const description = fare.fareInfo?.[0]?.baggageInformations?.[0]?.description;
  if (description) {
    return description;
  }

  return typeof fare.baggage === 'string' ? fare.baggage : undefined;
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

function buildVietnamOffsetIso(
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string,
  second: string,
): string {
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
  if (Number.isNaN(Date.parse(iso))) {
    throw new Error(`Ngày giờ bay không hợp lệ: ${day}-${month}-${year} ${hour}:${minute}`);
  }

  return iso;
}

function getFiniteNumber(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
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
