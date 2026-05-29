import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildBookRequest } from '../../booking/book-request.builder';
import { parseMuadiDateTime } from '../../flights/normalizer';
import { PrismaService } from '../../prisma/prisma.service';
import { MuadiClientService } from './muadi-client.service';
import {
  HoldParams,
  HoldPricing,
  HoldPnr,
  HoldResult,
  IMuadiProvider,
  MuadiAirlineFailure,
  MuadiBookingFee,
  MuadiRawFlight,
  SearchParams,
  SearchResult,
} from './muadi-provider.interface';

interface MuadiCreateSessionResponse {
  data?: {
    sessionID?: number;
    listSignIn?: string[];
  };
}

interface MuadiSearchFlightResponse {
  data?: MuadiSearchFlightPayload;
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

interface MuadiSearchFlightPayload {
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

@Injectable()
export class RealMuadiProvider implements IMuadiProvider {
  constructor(
    private readonly muadiClient: MuadiClientService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async search(params: SearchParams): Promise<SearchResult> {
    const session = await this.prisma.muadiSession.findFirst({
      where: {
        active: true,
        busy: false,
      },
      orderBy: {
        lastUsedAt: 'asc',
      },
    });
    if (!session) {
      throw new Error('Muadi session chưa được cấu hình hoặc đang bận');
    }

    const lock = await this.prisma.muadiSession.updateMany({
      where: {
        id: session.id,
        active: true,
        busy: false,
      },
      data: {
        busy: true,
        lastUsedAt: new Date(),
      },
    });
    if (lock.count !== 1) {
      throw new Error('Muadi session vừa được dùng bởi request khác');
    }

    try {
      await this.muadiClient.ensureValidSession(session.id);
      const baseBody = this.buildSearchBody(params);
      const createSession =
        await this.muadiClient.request<MuadiCreateSessionResponse>(
          '/booking/create-session',
          baseBody,
          {
            sessionId: session.id,
            authenticated: true,
            apiVersion: '2',
          },
        );
      const sessionID = createSession.data?.sessionID;
      const airlines = createSession.data?.listSignIn ?? [];
      if (!sessionID || airlines.length === 0) {
        throw new Error('Muadi không trả sessionID hoặc danh sách hãng bay');
      }

      const results = await Promise.allSettled(
        airlines.map(async (airline) => {
          const response =
            await this.muadiClient.searchFlightByAirline<MuadiSearchFlightResponse>(
              session.id,
              airline,
              {
                ...baseBody,
                sessionID,
              },
            );
          const body = this.getSearchPayload(response);
          const bookingFees = body.bookingFees ?? body.bookingFee;

          return {
            airline,
            departureFlight: [
              ...(body.departureFlight ?? []),
              ...(body.gdsFlight?.departureFlight ?? []),
            ].map((flight) => this.withAirline(flight, airline, bookingFees)),
            returnFlight: [
              ...(body.returnFlight ?? []),
              ...(body.gdsFlight?.returnFlight ?? []),
            ].map((flight) => this.withAirline(flight, airline, bookingFees)),
          };
        }),
      );

      const rawFlights: MuadiRawFlight[] = [];
      const returnRawFlights: MuadiRawFlight[] = [];
      const airlinesFailed: MuadiAirlineFailure[] = [];
      let successCount = 0;

      results.forEach((result, index) => {
        const airline = airlines[index];
        if (result.status === 'fulfilled') {
          successCount += 1;
          rawFlights.push(...result.value.departureFlight);
          returnRawFlights.push(...result.value.returnFlight);
          return;
        }

        airlinesFailed.push({
          airline,
          reason: this.safeReason(result.reason),
        });
      });

      if (successCount === 0) {
        throw new Error('Tất cả hãng bay Muadi search đều thất bại');
      }

      return {
        provider: 'muadi',
        searchedAt: new Date().toISOString(),
        muadiSessionId: sessionID,
        rawFlights,
        returnRawFlights:
          returnRawFlights.length > 0 ? returnRawFlights : undefined,
        airlinesQueried: airlines,
        airlinesFailed,
      };
    } finally {
      await this.prisma.muadiSession.update({
        where: {
          id: session.id,
        },
        data: {
          busy: false,
        },
      });
    }
  }

  async hold(params: HoldParams): Promise<HoldResult> {
    const session = await this.prisma.muadiSession.findFirst({
      where: {
        active: true,
        busy: false,
      },
      orderBy: {
        lastUsedAt: 'asc',
      },
    });
    if (!session) {
      throw new Error('Muadi session chưa được cấu hình hoặc đang bận');
    }

    const lock = await this.prisma.muadiSession.updateMany({
      where: {
        id: session.id,
        active: true,
        busy: false,
      },
      data: {
        busy: true,
        lastUsedAt: new Date(),
      },
    });
    if (lock.count !== 1) {
      throw new Error('Muadi session vừa được dùng bởi request khác');
    }

    try {
      await this.muadiClient.ensureValidSession(session.id);
      const baseBody = this.buildSearchBody({
        origin: params.snapshot.from,
        destination: params.snapshot.to,
        date: params.snapshot.date,
        paxAdt: params.snapshot.paxAdt,
        paxChd: params.snapshot.paxChd,
        paxInf: params.snapshot.paxInf,
      });
      const createSession =
        await this.muadiClient.request<MuadiCreateSessionResponse>(
          '/booking/create-session',
          baseBody,
          {
            sessionId: session.id,
            authenticated: true,
            apiVersion: '2',
          },
        );
      const freshSessionID = createSession.data?.sessionID;
      if (!freshSessionID) {
        throw new Error('Muadi không trả sessionID cho hold');
      }

      const searchResponse =
        await this.muadiClient.searchFlightByAirline<MuadiSearchFlightResponse>(
          session.id,
          params.snapshot.airline,
          {
            ...baseBody,
            sessionID: freshSessionID,
          },
        );
      const searchPayload = this.getSearchPayload(searchResponse);
      const bookingFees = searchPayload.bookingFees ?? searchPayload.bookingFee;
      const flights = [
        ...(searchPayload.departureFlight ?? []),
        ...(searchPayload.gdsFlight?.departureFlight ?? []),
      ].map((flight) =>
        this.withAirline(flight, params.snapshot.airline, bookingFees),
      );
      const flight = findMatchingFlight(
        flights,
        params.snapshot,
        params.fareClass,
      );
      if (!flight) {
        throw new Error('Hết chỗ');
      }
      const fare = resolveFare(params.fareClass, flight);
      const bookRequest = this.buildHoldBookRequest(
        params,
        flight,
        fare,
        freshSessionID,
      );
      const protectedBooking =
        await this.muadiClient.createBookingWithProtection<unknown>(
          session.id,
          bookRequest,
          params.username ?? session.username,
        );
      const reconciled = await this.reconcileHoldPricing(
        session.id,
        freshSessionID,
      );
      const pnrs = extractPnrs(reconciled.ticketInfo, reconciled.pricing);

      return {
        bookingResponse: protectedBooking.bookingResponse,
        ticketInfo: reconciled.ticketInfo,
        protectionVerified: protectedBooking.protectionVerified,
        pnrs,
        pricing: reconciled.pricing,
        flight,
        fare,
        bookRequest,
        muadiSessionId: freshSessionID,
        snapshotPriceVnd: params.snapshot.snapshotPriceVnd,
        priceChanged: isPriceChanged(
          params.snapshot.snapshotPriceVnd,
          reconciled.pricing.totalNetPrice,
        ),
      };
    } finally {
      await this.prisma.muadiSession.update({
        where: {
          id: session.id,
        },
        data: {
          busy: false,
        },
      });
    }
  }

  private async reconcileHoldPricing(
    sessionId: string,
    muadiSessionID: number,
  ): Promise<{ ticketInfo: unknown; pricing: HoldPricing }> {
    const attempts = this.getNumberConfig(
      'HOLD_PRICING_TICKETINFO_ATTEMPTS',
      3,
    );
    let latestTicketInfo: unknown = null;
    let latestPnrs: string[] = [];
    let delayMs = 250;

    for (let index = 0; index < attempts; index += 1) {
      latestTicketInfo = await this.muadiClient.getTicketInfoBySessionId<unknown>(
        sessionId,
        muadiSessionID,
      );
      const pricing = pricingFromTicketInfo(latestTicketInfo);
      latestPnrs = pricing.pnrCodes;
      if (pricing.verified) {
        return {
          ticketInfo: latestTicketInfo,
          pricing: pricing.value,
        };
      }
      if (index < attempts - 1) {
        await delay(delayMs);
        delayMs = Math.min(Math.round(delayMs * 1.5), 1500);
      }
    }

    const fallback = await this.reconcileHoldPricingByListBooking(
      sessionId,
      latestPnrs,
    );
    if (fallback) {
      return {
        ticketInfo: latestTicketInfo,
        pricing: fallback,
      };
    }

    throw new Error('Chưa lấy được giá giữ chỗ');
  }

  private async reconcileHoldPricingByListBooking(
    sessionId: string,
    pnrCodes: string[],
  ): Promise<HoldPricing | null> {
    const targets = Array.from(
      new Set(pnrCodes.map(normalizePnr).filter(Boolean)),
    );
    if (targets.length === 0) {
      return null;
    }

    const attempts = this.getNumberConfig('HOLD_PRICING_FALLBACK_ATTEMPTS', 2);
    let delayMs = 300;
    for (let index = 0; index < attempts; index += 1) {
      const response = await this.muadiClient.listBookings<unknown>(sessionId);
      const pricing = pricingFromListBooking(response, targets);
      if (pricing) {
        return pricing;
      }
      if (index < attempts - 1) {
        await delay(delayMs);
        delayMs = Math.min(Math.round(delayMs * 1.4), 1200);
      }
    }

    return null;
  }

  private buildHoldBookRequest(
    params: HoldParams,
    flight: MuadiRawFlight,
    fare: NonNullable<MuadiRawFlight['priceInfo']>[number],
    freshSessionID: number,
  ) {
    const firstSegment = flight.routeInfo?.[0];
    const lastSegment = flight.routeInfo?.[flight.routeInfo.length - 1];

    return buildBookRequest({
      sessionId: freshSessionID,
      originCode: firstSegment?.from ?? flight.from ?? params.snapshot.from,
      destinationCode: lastSegment?.to ?? flight.to ?? params.snapshot.to,
      departureDateTime: toMuadiDate(params.snapshot.date),
      numberOfAdult: params.snapshot.paxAdt,
      numberOfChildren: params.snapshot.paxChd,
      numberOfInfant: params.snapshot.paxInf,
      flight,
      fare,
      passengers: params.passengers,
      contact: params.contact,
      isExportNow: false,
    });
  }

  private buildSearchBody(params: SearchParams) {
    return {
      originCode: params.origin,
      destinationCode: params.destination,
      departureDateTime: toMuadiDate(params.date),
      journeyType: 'OW',
      numberOfAdult: params.paxAdt,
      numberOfChildren: params.paxChd,
      numberOfInfant: params.paxInf,
      currencyCode: 'VND',
      searchType: 'BP',
      promotionCodes: [],
      airlines: [],
      systems: [],
    };
  }

  private safeReason(reason: unknown): string {
    if (reason instanceof Error) {
      return reason.message;
    }

    return String(reason);
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = Number(this.config.get<string>(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private getSearchPayload(
    response: MuadiSearchFlightResponse,
  ): MuadiSearchFlightPayload {
    return response.data ?? response;
  }

  private withAirline(
    flight: MuadiRawFlight,
    airline: string,
    bookingFees: MuadiBookingFee[] | undefined,
  ): MuadiRawFlight {
    return {
      ...flight,
      airline: flight.airline ?? airline,
      bookingFees: flight.bookingFees ?? flight.bookingFee ?? bookingFees,
    };
  }
}

export function toMuadiDate(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Ngày bay không hợp lệ: ${isoDate}`);
  }

  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function extractPnrs(response: unknown, pricing?: HoldPricing): HoldPnr[] {
  const data =
    response && typeof response === 'object' && 'data' in response
      ? (response as { data?: unknown }).data
      : response;
  const list =
    data && typeof data === 'object' && 'listPNR' in data
      ? (data as { listPNR?: unknown }).listPNR
      : [];
  if (!Array.isArray(list)) {
    return [];
  }

  const priceByPnr = new Map(
    (pricing?.byPnr ?? []).map((item) => [normalizePnr(item.pnr), item]),
  );

  return list.map((item) => {
    const pnr = item as Record<string, unknown>;
    const pnrCode = String(pnr.pnr ?? pnr.message ?? '');
    const price = priceByPnr.get(normalizePnr(pnrCode));
    const total = price?.total ?? readMoney(pnr.total);

    return {
      airline: String(pnr.airline ?? ''),
      pnr: pnrCode,
      status: pnr.status === undefined ? undefined : String(pnr.status),
      timelimit:
        price?.timelimit ??
        (pnr.timelimit === undefined && pnr.timeLimit === undefined
          ? undefined
          : String(pnr.timelimit ?? pnr.timeLimit)),
      total: total ?? undefined,
      message: pnr.message === undefined ? undefined : String(pnr.message),
      rawJson: item,
    };
  });
}

export function pricingFromTicketInfo(
  response: unknown,
):
  | { verified: true; value: HoldPricing; pnrCodes: string[] }
  | { verified: false; pnrCodes: string[] } {
  const rows = getListPnr(response);
  const pnrCodes = rows
    .map((row) => normalizePnr(String(row.pnr ?? row.message ?? '')))
    .filter(Boolean);
  const priced: HoldPricing['byPnr'] = [];
  for (const row of rows) {
    const total = readMoney(row.total);
    const pnr = normalizePnr(String(row.pnr ?? row.message ?? ''));
    if (!pnr || total === null) {
      continue;
    }

    priced.push({
      pnr,
      total,
      airline: row.airline === undefined ? undefined : String(row.airline),
      status: row.status === undefined ? undefined : String(row.status),
      timelimit:
        row.timelimit === undefined && row.timeLimit === undefined
          ? undefined
          : String(row.timelimit ?? row.timeLimit),
      rawJson: row,
    });
  }

  if (priced.length === 0 || priced.length !== rows.length) {
    return {
      verified: false,
      pnrCodes,
    };
  }

  return {
    verified: true,
    pnrCodes,
    value: {
      verified: true,
      source: 'booking/ticket-info-by-id',
      totalNetPrice: priced.reduce((sum, row) => sum + row.total, 0),
      currency: 'VND',
      byPnr: priced,
      syncedAt: new Date().toISOString(),
    },
  };
}

export function pricingFromListBooking(
  response: unknown,
  pnrCodes: string[],
): HoldPricing | null {
  const rows = getListBookingRows(response);
  const targetSet = new Set(pnrCodes.map(normalizePnr).filter(Boolean));
  const byPnr = new Map<string, HoldPricing['byPnr'][number]>();

  for (const row of rows) {
    const pnr = normalizePnr(String(row.pnrCode ?? row.pnr ?? ''));
    if (!pnr || !targetSet.has(pnr)) {
      continue;
    }
    const total = readMoney(row.totalPrice ?? row.total);
    if (total === null) {
      continue;
    }
    byPnr.set(pnr, {
      pnr,
      total,
      status:
        row.bookingStatusNote === undefined && row.bookingStatus === undefined
          ? undefined
          : String(row.bookingStatusNote ?? row.bookingStatus),
      timelimit:
        row.timelimit === undefined ? undefined : String(row.timelimit),
      rawJson: row,
    });
  }

  const priced = pnrCodes
    .map((pnr) => byPnr.get(normalizePnr(pnr)))
    .filter((row): row is HoldPricing['byPnr'][number] => row !== undefined);
  if (priced.length !== targetSet.size) {
    return null;
  }

  return {
    verified: true,
    source: 'management/list-booking-fallback',
    totalNetPrice: priced.reduce((sum, row) => sum + row.total, 0),
    currency: 'VND',
    byPnr: priced,
    syncedAt: new Date().toISOString(),
  };
}

function getListPnr(response: unknown): Array<Record<string, unknown>> {
  const data =
    response && typeof response === 'object' && 'data' in response
      ? (response as { data?: unknown }).data
      : response;
  const list =
    data && typeof data === 'object' && 'listPNR' in data
      ? (data as { listPNR?: unknown }).listPNR
      : [];

  return Array.isArray(list) ? (list as Array<Record<string, unknown>>) : [];
}

function getListBookingRows(response: unknown): Array<Record<string, unknown>> {
  const data =
    response && typeof response === 'object' && 'data' in response
      ? (response as { data?: unknown }).data
      : response;

  return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
}

function findMatchingFlight(
  flights: MuadiRawFlight[],
  snapshot: HoldParams['snapshot'],
  fareClass: string,
): MuadiRawFlight | null {
  const targetFlightNumber = snapshot.flightNumber.toUpperCase();
  const targetDepartMs = Date.parse(snapshot.departDate);

  return (
    flights.find((flight) => {
      const firstSegment = flight.routeInfo?.[0];
      const flightNumber = buildFullFlightNumber(
        firstSegment?.carrierCode ?? flight.airline ?? flight.carrierCode,
        firstSegment?.flightNumber ?? flight.flightNumber,
      );
      const departMs = Date.parse(
        parseMuadiDateTime(
          String(firstSegment?.departDate ?? flight.departDateTime ?? ''),
        ),
      );

      return (
        flightNumber === targetFlightNumber &&
        (!Number.isFinite(targetDepartMs) || departMs === targetDepartMs) &&
        Boolean(resolveFare(fareClass, flight, false))
      );
    }) ?? null
  );
}

function resolveFare(
  fareClass: string,
  flight: MuadiRawFlight,
  shouldThrow = true,
): NonNullable<MuadiRawFlight['priceInfo']>[number] {
  const fare = flight.priceInfo?.find(
    (item) =>
      item.class === fareClass ||
      item.fareClass === fareClass ||
      item.fareInfo?.[0]?.class === fareClass,
  );
  if (!fare && shouldThrow) {
    throw new Error('Hết chỗ');
  }
  if (fare && (fare.soldOut === true || (fare.seatAvailable ?? 1) <= 0)) {
    if (shouldThrow) {
      throw new Error('Hết chỗ');
    }
    return undefined as never;
  }

  return fare as NonNullable<MuadiRawFlight['priceInfo']>[number];
}

function buildFullFlightNumber(
  carrier: string | undefined,
  number: string | undefined,
): string {
  const normalizedCarrier = (carrier ?? '').toUpperCase();
  const normalizedNumber = (number ?? '').toUpperCase();
  if (!normalizedCarrier) {
    return normalizedNumber;
  }
  if (normalizedNumber.startsWith(normalizedCarrier)) {
    return normalizedNumber;
  }

  return `${normalizedCarrier}${normalizedNumber}`;
}

function normalizePnr(value: string): string {
  return value.trim().toUpperCase();
}

function readMoney(value: unknown): number | null {
  const amount =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.replace(/[^\d.-]/g, ''))
        : NaN;

  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

function isPriceChanged(
  snapshotPriceVnd: number,
  totalNetPrice: number,
): boolean {
  return (
    snapshotPriceVnd > 0 &&
    Math.abs(totalNetPrice - snapshotPriceVnd) / snapshotPriceVnd > 0.05
  );
}
