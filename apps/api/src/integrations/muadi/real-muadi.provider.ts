import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MuadiClientService } from './muadi-client.service';
import {
  HoldParams,
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
      const protectedBooking =
        await this.muadiClient.createBookingWithProtection<unknown>(
          session.id,
          params.bookRequest,
          params.username ?? session.username,
        );
      const ticketInfo = await this.pollTicketInfo(
        session.id,
        params.sessionId,
        params.pollAttempts ?? 10,
        params.pollDelayMs ?? 500,
        protectedBooking.bookingResponse,
      );

      return {
        bookingResponse: protectedBooking.bookingResponse,
        ticketInfo,
        protectionVerified: protectedBooking.protectionVerified,
        pnrs: extractPnrs(ticketInfo),
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

  private async pollTicketInfo(
    sessionId: string,
    muadiSessionID: number,
    attempts: number,
    initialDelayMs: number,
    fallbackResponse: unknown,
  ): Promise<unknown> {
    let lastResponse = fallbackResponse;
    let delayMs = initialDelayMs;

    for (let index = 0; index < attempts; index += 1) {
      lastResponse = await this.muadiClient.getTicketInfoBySessionId<unknown>(
        sessionId,
        muadiSessionID,
      );
      if (hasCompletePnrResponse(lastResponse)) {
        return lastResponse;
      }
      if (index < attempts - 1) {
        await delay(delayMs);
        delayMs = Math.min(Math.round(delayMs * 1.4), 2000);
      }
    }

    return lastResponse;
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

function extractPnrs(response: unknown): HoldPnr[] {
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

  return list.map((item) => {
    const pnr = item as Record<string, unknown>;
    return {
      airline: String(pnr.airline ?? ''),
      pnr: String(pnr.pnr ?? pnr.message ?? ''),
      status: pnr.status === undefined ? undefined : String(pnr.status),
      timelimit:
        pnr.timelimit === undefined && pnr.timeLimit === undefined
          ? undefined
          : String(pnr.timelimit ?? pnr.timeLimit),
      message: pnr.message === undefined ? undefined : String(pnr.message),
      rawJson: item,
    };
  });
}

function hasCompletePnrResponse(response: unknown): boolean {
  const pnrs = extractPnrs(response);
  return (
    pnrs.length > 0 &&
    pnrs.every(
      (item) =>
        !['WAIT', 'LOADING'].includes((item.status ?? '').toUpperCase()),
    )
  );
}
