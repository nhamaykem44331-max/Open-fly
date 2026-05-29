import {
  MuadiRawFare,
  MuadiRawFlight,
  MuadiRawSegment,
} from '../integrations/muadi/muadi-provider.interface';
import {
  HoldContactDto,
  HoldPassengerDto,
  PassengerType,
} from './dto/hold-booking.dto';

export interface BuildBookRequestInput {
  sessionId: number;
  originCode: string;
  destinationCode: string;
  departureDateTime: string;
  numberOfAdult: number;
  numberOfChildren: number;
  numberOfInfant: number;
  flight: MuadiRawFlight;
  fare: MuadiRawFare;
  passengers: HoldPassengerDto[];
  contact: HoldContactDto;
  isExportNow?: boolean;
}

export interface MuadiPassenger {
  id: string;
  type: PassengerType;
  title: string;
  firstName: string;
  lastName: string;
  birthday?: string;
  loyalty: unknown[];
  goldCard: string;
  listLuggage: unknown[];
  ancillaryServices: unknown[];
}

export function buildBookRequest(input: BuildBookRequestInput) {
  const request = {
    sessionID: input.sessionId,
    originCode: input.originCode,
    destinationCode: input.destinationCode,
    departureDateTime: input.departureDateTime,
    numberOfAdult: input.numberOfAdult,
    numberOfChildren: input.numberOfChildren,
    numberOfInfant: input.numberOfInfant,
    currencyCode: input.fare.currencyCode ?? 'VND',
  };
  const listPax = normalizePassengerList(input.passengers);
  const outboundEntry = buildRouteEntry({
    flight: input.flight,
    fare: input.fare,
    request,
    fromCode: input.originCode,
    toCode: input.destinationCode,
    departDate: input.departureDateTime,
  });

  return {
    sessionID: request.sessionID,
    isExportNow: input.isExportNow ?? false,
    isReBook: false,
    isNDC: Boolean(input.flight.isNDC),
    extraInfo: '',
    customerInfo: contactFromSession(input.contact, listPax[0]),
    listRoutes: [outboundEntry],
    listPax,
    adt: input.numberOfAdult,
    chd: input.numberOfChildren,
    inf: input.numberOfInfant,
    currencyCode: request.currencyCode,
    promotions: [],
    listCAs: [],
    pincode: '',
    isSplitSegment: false,
  };
}

export function buildRouteEntry({
  flight,
  fare,
  request,
  fromCode,
  toCode,
  departDate,
}: {
  flight: MuadiRawFlight;
  fare: MuadiRawFare;
  request: { currencyCode?: string };
  fromCode: string;
  toCode: string;
  departDate: string;
}) {
  const segments = segmentsOf(flight);
  const currencyCode = fare.currencyCode || request.currencyCode || 'VND';
  const routeId = fare.id || flight.id;
  const listRoute = segments.map((route) => {
    const market = `${route.from || ''}${route.to || ''}`;
    const fareInfo =
      (fare.fareInfo || []).find((item) => item.market === market) ||
      (fare.fareInfo && fare.fareInfo[0]) ||
      {};

    return {
      from: route.from || fromCode,
      to: route.to || toCode,
      departDate: route.departDate || flight.departDateTime,
      arrivalDate: route.arrivalDate || flight.arrivalDateTime,
      airCraft: route.airCraft || route.aircraft || '',
      flightNumber: route.flightNumber || '',
      carrierCode: route.carrierCode || flight.airline,
      class: fare.class,
      cabinClass: fareInfo.cabinClass || 'Economy',
      flightTime: route.flightTime,
      jPrice: {
        class: fare.class,
        fareBasis: fareInfo.fareBasis || '',
        seat: fare.seatAvailable,
        price: 0,
        tax: 0,
        vat: 0,
        adminFee: 0,
        fareADT: money(fare.fareADT),
        taxADT: money(fare.taxADT) + money(fare.vatADT),
        fareCHD: money(fare.fareCHD),
        taxCHD: money(fare.taxCHD) + money(fare.vatCHD),
        fareINF: money(fare.fareINF),
        taxINF: money(fare.taxINF) + money(fare.vatINF),
        source: fare.source || flight.source,
        currencyCode,
      },
    };
  });

  return {
    id: routeId,
    typeBook: flight.typeOfBook || fare.typeOfBook || 'NN',
    from: fromCode,
    to: toCode,
    departDate,
    airline: flight.airline,
    source: flight.source || fare.source,
    listRoute,
  };
}

export function normalizePassengerList(
  passengers: HoldPassengerDto[],
): MuadiPassenger[] {
  return passengers.map((passenger, index) =>
    parsePassengerName(passenger, index),
  );
}

export function parsePassengerName(
  passenger: HoldPassengerDto,
  index: number,
): MuadiPassenger {
  return {
    id: `${passenger.type}-${index + 1}`,
    type: passenger.type,
    title: passenger.title.toUpperCase(),
    firstName: stripVietnamese(passenger.firstName).toUpperCase(),
    lastName: stripVietnamese(passenger.lastName).toUpperCase(),
    ...(passenger.dob ? { birthday: normalizeBirthday(passenger.dob) } : {}),
    loyalty: [],
    goldCard: '',
    listLuggage: [],
    ancillaryServices: [],
  };
}

export function contactFromSession(
  contact: HoldContactDto,
  passenger: MuadiPassenger,
) {
  return {
    email: contact.email,
    fullName: `${passenger.firstName} ${passenger.lastName}`.trim(),
    phoneNumber: toLocalVnPhone(contact.phone),
    address: '',
    extraInfo: '',
  };
}

function toLocalVnPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+84')) {
    return `0${trimmed.slice(3)}`;
  }
  if (trimmed.startsWith('84')) {
    return `0${trimmed.slice(2)}`;
  }

  return trimmed;
}

function segmentsOf(flight: MuadiRawFlight): MuadiRawSegment[] {
  if (Array.isArray(flight.routeInfo) && flight.routeInfo.length > 0) {
    return flight.routeInfo;
  }

  return [
    {
      from: flight.from,
      to: flight.to,
      departDate: flight.departDateTime ?? flight.departDate,
      arrivalDate: flight.arrivalDateTime ?? flight.arrivalDate,
      flightNumber: flight.flightNumber,
      carrierCode: flight.carrierCode ?? flight.airline,
      aircraft: flight.aircraft,
    },
  ];
}

function stripVietnamese(value: string): string {
  return value
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s/-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeBirthday(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
}

function money(value: number | undefined): number {
  return Number(value || 0);
}
