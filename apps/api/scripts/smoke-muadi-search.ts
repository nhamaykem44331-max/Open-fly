import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MuadiSession } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { normalizeFlight } from '../src/flights/normalizer';
import {
  IMuadiProvider,
  MUADI_PROVIDER,
  MuadiBookingFee,
  MuadiRawFlight,
} from '../src/integrations/muadi/muadi-provider.interface';
import { MuadiClientService } from '../src/integrations/muadi/muadi-client.service';
import { toMuadiDate } from '../src/integrations/muadi/real-muadi.provider';
import { PrismaService } from '../src/prisma/prisma.service';

interface MuadiCreateSessionResponse {
  data?: {
    sessionID?: number;
    listSignIn?: string[];
  };
  sessionID?: number;
  listSignIn?: string[];
}

interface MuadiSearchPayload {
  departureFlight?: MuadiRawFlight[];
  returnFlight?: MuadiRawFlight[];
  gdsFlight?: {
    departureFlight?: MuadiRawFlight[];
    returnFlight?: MuadiRawFlight[];
  };
  bookingFee?: MuadiBookingFee[];
  bookingFees?: MuadiBookingFee[];
  source?: unknown;
}

interface MuadiSearchFlightResponse extends MuadiSearchPayload {
  data?: MuadiSearchPayload;
}

interface ShapeReport {
  routeInfoMatches: boolean;
  priceInfoMatches: boolean;
  departDateFormat: string;
  gdsFlightPresent: boolean;
  extraRouteInfoFields: string[];
  extraPriceInfoFields: string[];
  missingRouteInfoFields: string[];
  missingPriceInfoFields: string[];
}

async function bootstrap() {
  Logger.overrideLogger(['error', 'warn', 'log']);
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const config = app.get(ConfigService);
    const useMock = config.get<string>('MUADI_USE_MOCK');
    if (useMock !== 'false') {
      throw new Error('MUADI_USE_MOCK phải là false để chạy smoke Muadi thật');
    }

    const provider = app.get<IMuadiProvider>(MUADI_PROVIDER);
    const prisma = app.get(PrismaService);
    const muadiClient = app.get(MuadiClientService);
    const date = futureDate(14);
    const query = {
      origin: 'SGN',
      destination: 'HAN',
      date,
      paxAdt: 1,
      paxChd: 0,
      paxInf: 0,
    };

    const searchResult = await provider.search(query);
    if (searchResult.provider !== 'muadi') {
      throw new Error(
        'Muadi smoke đang dùng mock provider, kiểm tra MUADI_USE_MOCK',
      );
    }

    const offers = searchResult.rawFlights.map((flight) =>
      normalizeFlight(flight, flight.airline ?? flight.carrierCode ?? ''),
    );
    const firstOffer = offers[0] ?? null;
    const sample = await fetchSampleAirlineResponse(
      prisma,
      muadiClient,
      searchResult.airlinesQueried,
      query,
    );
    const payload = getSearchPayload(sample.response);
    const sampleFlight = findFirstFlight(payload);
    const shape = buildShapeReport(payload, sampleFlight);
    const sanitizedSampleResponse = sanitize(sample.response);
    const fixture = {
      capturedAt: new Date().toISOString(),
      environment: 'production',
      query,
      airlinesQueried: searchResult.airlinesQueried,
      airlinesFailed: searchResult.airlinesFailed,
      offersLength: offers.length,
      firstOffer,
      sampleAirline: sample.airline,
      shape,
      sampleResponse: sanitizedSampleResponse,
    };

    await writeFixture(fixture);

    console.log(
      `airlinesQueried=${JSON.stringify(searchResult.airlinesQueried)}`,
    );
    console.log(
      `airlinesFailed=${JSON.stringify(searchResult.airlinesFailed)}`,
    );
    console.log(`offers.length=${offers.length}`);
    console.log(`firstOffer=${JSON.stringify(firstOffer, null, 2)}`);
    console.log(`rawSampleAirline=${sample.airline}`);
    console.log(
      `rawSampleResponse=${JSON.stringify(sanitizedSampleResponse, null, 2)}`,
    );
    printShapeReport(shape);
  } catch (error) {
    console.error('Muadi smoke search failed');
    console.error(JSON.stringify(sanitize(error), null, 2));
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

async function fetchSampleAirlineResponse(
  prisma: PrismaService,
  muadiClient: MuadiClientService,
  airlines: string[],
  query: {
    origin: string;
    destination: string;
    date: string;
    paxAdt: number;
    paxChd: number;
    paxInf: number;
  },
): Promise<{ airline: string; response: MuadiSearchFlightResponse }> {
  const session = await findActiveSession(prisma);
  await muadiClient.ensureValidSession(session.id);
  const body = buildSearchBody(query);
  const createSession = await muadiClient.request<MuadiCreateSessionResponse>(
    '/booking/create-session',
    body,
    {
      sessionId: session.id,
      authenticated: true,
      apiVersion: '2',
    },
  );
  const sessionID = createSession.data?.sessionID ?? createSession.sessionID;
  if (!sessionID) {
    throw new Error(
      'Muadi create-session không trả sessionID cho sample raw response',
    );
  }

  const airline =
    airlines[0] ?? createSession.data?.listSignIn?.[0] ?? createSession.listSignIn?.[0];
  if (!airline) {
    throw new Error(
      'Muadi create-session không trả hãng bay để lấy sample raw response',
    );
  }

  return {
    airline,
    response:
      await muadiClient.searchFlightByAirline<MuadiSearchFlightResponse>(
        session.id,
        airline,
        {
          ...body,
          sessionID,
        },
      ),
  };
}

async function findActiveSession(prisma: PrismaService): Promise<MuadiSession> {
  const session = await prisma.muadiSession.findFirst({
    where: {
      active: true,
    },
    orderBy: {
      lastUsedAt: 'desc',
    },
  });
  if (!session) {
    throw new Error(
      'Chưa có MuadiSession active. Chạy npm run seed:muadi trước.',
    );
  }

  return session;
}

function buildSearchBody(query: {
  origin: string;
  destination: string;
  date: string;
  paxAdt: number;
  paxChd: number;
  paxInf: number;
}) {
  return {
    originCode: query.origin,
    destinationCode: query.destination,
    departureDateTime: toMuadiDate(query.date),
    journeyType: 'OW',
    numberOfAdult: query.paxAdt,
    numberOfChildren: query.paxChd,
    numberOfInfant: query.paxInf,
    currencyCode: 'VND',
    searchType: 'BP',
    promotionCodes: [],
    airlines: [],
    systems: [],
  };
}

function getSearchPayload(
  response: MuadiSearchFlightResponse,
): MuadiSearchPayload {
  return response.data ?? response;
}

function findFirstFlight(payload: MuadiSearchPayload): MuadiRawFlight | null {
  return (
    payload.departureFlight?.[0] ??
    payload.gdsFlight?.departureFlight?.[0] ??
    payload.returnFlight?.[0] ??
    payload.gdsFlight?.returnFlight?.[0] ??
    null
  );
}

function buildShapeReport(
  payload: MuadiSearchPayload,
  flight: MuadiRawFlight | null,
): ShapeReport {
  const routeInfo = flight?.routeInfo?.[0] ?? null;
  const priceInfo = flight?.priceInfo?.[0] ?? null;
  const expectedRoute = [
    'carrierCode',
    'carrierName',
    'flightNumber',
    'from',
    'to',
    'departDate',
    'arrivalDate',
    'flightTimeHour',
    'flightTimeMinute',
  ];
  const expectedPrice = [
    'class',
    'seatAvailable',
    'fareADT',
    'taxADT',
    'vatADT',
    'fareInfo',
  ];
  const routeKeys = routeInfo ? Object.keys(routeInfo) : [];
  const priceKeys = priceInfo ? Object.keys(priceInfo) : [];

  return {
    routeInfoMatches: expectedRoute.every((key) => routeKeys.includes(key)),
    priceInfoMatches: expectedPrice.every((key) => priceKeys.includes(key)),
    departDateFormat: detectDateFormat(routeInfo?.departDate),
    gdsFlightPresent: Boolean(payload.gdsFlight),
    extraRouteInfoFields: routeKeys.filter(
      (key) => !expectedRoute.includes(key),
    ),
    extraPriceInfoFields: priceKeys.filter(
      (key) => !expectedPrice.includes(key),
    ),
    missingRouteInfoFields: expectedRoute.filter(
      (key) => !routeKeys.includes(key),
    ),
    missingPriceInfoFields: expectedPrice.filter(
      (key) => !priceKeys.includes(key),
    ),
  };
}

function detectDateFormat(value: unknown): string {
  if (typeof value !== 'string') {
    return 'missing/non-string';
  }
  if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return 'DD-MM-YYYY HH:mm';
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return 'YYYY-MM-DD HH:mm';
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return 'ISO-8601';
  }

  return `unknown: ${value}`;
}

function printShapeReport(shape: ShapeReport): void {
  console.log('shapeVerification=');
  console.log(
    `- routeInfo expected fields: ${shape.routeInfoMatches ? 'OK' : 'MISMATCH'}`,
  );
  console.log(
    `- priceInfo expected fields: ${shape.priceInfoMatches ? 'OK' : 'MISMATCH'}`,
  );
  console.log(`- departDate format: ${shape.departDateFormat}`);
  console.log(`- gdsFlight present: ${shape.gdsFlightPresent ? 'yes' : 'no'}`);
  console.log(
    `- extra routeInfo fields: ${JSON.stringify(shape.extraRouteInfoFields)}`,
  );
  console.log(
    `- extra priceInfo fields: ${JSON.stringify(shape.extraPriceInfoFields)}`,
  );
  console.log(
    `- missing routeInfo fields: ${JSON.stringify(shape.missingRouteInfoFields)}`,
  );
  console.log(
    `- missing priceInfo fields: ${JSON.stringify(shape.missingPriceInfoFields)}`,
  );
}

async function writeFixture(value: unknown): Promise<void> {
  const targetDir = join(__dirname, '../src/integrations/muadi/fixtures');
  await mkdir(targetDir, { recursive: true });
  await writeFile(
    join(targetDir, 'muadi-search-sample.json'),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
}

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    const details = value as Error & {
      status?: number;
      body?: unknown;
      response?: unknown;
      headers?: unknown;
    };
    return sanitize({
      name: value.name,
      message: value.message,
      status: details.status,
      body: details.body,
      response: details.response,
      headers: details.headers,
      stack: value.stack,
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        shouldRedactKey(key) ? redactValue(item) : sanitize(item),
      ]),
    );
  }

  return value;
}

function shouldRedactKey(key: string): boolean {
  return /token|password|authorization|encrypted|secret|otp|tsp|agent|member|sessionid|sessionId|phone|email|pnr/i.test(
    key,
  );
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.length > 4 ? `***${value.slice(-4)}` : '***';
  }
  if (value && typeof value === 'object') {
    return '[REDACTED]';
  }

  return '[REDACTED]';
}

function futureDate(daysFromNow: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);

  return date.toISOString().slice(0, 10);
}

bootstrap().catch((error) => {
  console.error('Muadi smoke search crashed');
  console.error(JSON.stringify(sanitize(error), null, 2));
  process.exit(1);
});
