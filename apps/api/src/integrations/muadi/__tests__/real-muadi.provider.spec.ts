import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { MuadiClientService } from '../muadi-client.service';
import { RealMuadiProvider } from '../real-muadi.provider';

describe('RealMuadiProvider hold', () => {
  let client: jest.Mocked<
    Pick<
      MuadiClientService,
      | 'ensureValidSession'
      | 'request'
      | 'searchFlightByAirline'
      | 'createBookingWithProtection'
      | 'getTicketInfoBySessionId'
      | 'listBookings'
    >
  >;
  let prisma: {
    muadiSession: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let config: Pick<ConfigService, 'get'>;
  let provider: RealMuadiProvider;

  beforeEach(() => {
    client = {
      ensureValidSession: jest.fn().mockResolvedValue(session()),
      request: jest.fn().mockResolvedValue({
        data: {
          sessionID: 987654,
        },
      }),
      searchFlightByAirline: jest.fn().mockResolvedValue({
        data: {
          departureFlight: [mockFlight()],
        },
      }),
      createBookingWithProtection: jest.fn().mockResolvedValue({
        bookingResponse: {
          success: true,
        },
        protectionVerified: false,
      }),
      getTicketInfoBySessionId: jest.fn().mockResolvedValue(ticketInfo(3000000)),
      listBookings: jest.fn(),
    };
    prisma = {
      muadiSession: {
        findFirst: jest.fn().mockResolvedValue(session()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue(session()),
      },
    };
    config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          HOLD_PRICING_TICKETINFO_ATTEMPTS: '3',
          HOLD_PRICING_FALLBACK_ATTEMPTS: '2',
        };

        return values[key];
      }),
    };
    provider = new RealMuadiProvider(
      client as unknown as MuadiClientService,
      prisma as unknown as PrismaService,
      config as ConfigService,
    );
  });

  it('uses a fresh Muadi search session before create-booking and locks ticket-info total', async () => {
    const result = await provider.hold(holdParams());

    expect(client.request).toHaveBeenCalledWith(
      '/booking/create-session',
      expect.objectContaining({
        departureDateTime: '11-06-2026',
      }),
      expect.objectContaining({
        authenticated: true,
        apiVersion: '2',
      }),
    );
    expect(client.searchFlightByAirline).toHaveBeenCalledWith(
      'muadi-session-id',
      'VN',
      expect.objectContaining({
        sessionID: 987654,
      }),
    );
    expect(client.createBookingWithProtection).toHaveBeenCalledWith(
      'muadi-session-id',
      expect.objectContaining({
        sessionID: 987654,
        isExportNow: false,
      }),
      'TESTUSER',
    );
    expect(result.muadiSessionId).toBe(987654);
    expect(result.pricing.totalNetPrice).toBe(3000000);
    expect(result.pnrs[0]).toEqual(
      expect.objectContaining({
        pnr: 'PNR123',
        total: 3000000,
        timelimit: '11-06-2026 23:50:00',
      }),
    );
  });

  it('polls ticket-info until total appears', async () => {
    client.getTicketInfoBySessionId
      .mockResolvedValueOnce(ticketInfo(undefined))
      .mockResolvedValueOnce(ticketInfo(3000000));

    const result = await provider.hold(holdParams());

    expect(client.getTicketInfoBySessionId).toHaveBeenCalledTimes(2);
    expect(result.pricing.totalNetPrice).toBe(3000000);
  });

  it('falls back to management/list-booking when ticket-info has no total', async () => {
    config.get = jest.fn((key: string) =>
      key === 'HOLD_PRICING_TICKETINFO_ATTEMPTS'
        ? '1'
        : key === 'HOLD_PRICING_FALLBACK_ATTEMPTS'
          ? '1'
          : undefined,
    );
    client.getTicketInfoBySessionId.mockResolvedValue(ticketInfo(undefined));
    client.listBookings.mockResolvedValue({
      data: [
        {
          pnrCode: 'PNR123',
          totalPrice: 3010000,
          timelimit: '11-06-2026 23:55:00',
        },
      ],
    });

    const result = await provider.hold(holdParams());

    expect(client.listBookings).toHaveBeenCalledWith('muadi-session-id');
    expect(result.pricing.source).toBe('management/list-booking-fallback');
    expect(result.pricing.totalNetPrice).toBe(3010000);
  });

  it('throws when ticket-info and fallback cannot reconcile price', async () => {
    config.get = jest.fn((key: string) =>
      key === 'HOLD_PRICING_TICKETINFO_ATTEMPTS'
        ? '1'
        : key === 'HOLD_PRICING_FALLBACK_ATTEMPTS'
          ? '1'
          : undefined,
    );
    client.getTicketInfoBySessionId.mockResolvedValue(ticketInfo(undefined));
    client.listBookings.mockResolvedValue({ data: [] });

    await expect(provider.hold(holdParams())).rejects.toThrow(
      'Chưa lấy được giá giữ chỗ',
    );
  });

  it('throws when fresh search no longer contains the selected offer', async () => {
    client.searchFlightByAirline.mockResolvedValue({
      data: {
        departureFlight: [],
      },
    });

    await expect(provider.hold(holdParams())).rejects.toThrow('Hết chỗ');
    expect(client.createBookingWithProtection).not.toHaveBeenCalled();
  });
});

function session() {
  return {
    id: 'muadi-session-id',
    username: 'TESTUSER',
  };
}

function holdParams() {
  return {
    snapshot: {
      from: 'SGN',
      to: 'HAN',
      date: '2026-06-11',
      paxAdt: 1,
      paxChd: 0,
      paxInf: 0,
      airline: 'VN',
      flightNumber: 'VN252',
      departDate: '2026-06-11T16:40:00+07:00',
      fareClass: 'L',
      snapshotPriceVnd: 2886000,
    },
    fareClass: 'L',
    passengers: [
      {
        title: 'MR',
        firstName: 'Anh',
        lastName: 'Vu',
        type: 'ADT' as const,
      },
    ],
    contact: {
      phone: '+84938121234',
      email: 'guest@example.com',
    },
  };
}

function mockFlight() {
  return {
    airline: 'VN',
    from: 'SGN',
    to: 'HAN',
    routeInfo: [
      {
        carrierCode: 'VN',
        carrierName: 'Vietnam Airlines',
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
        id: 'SGNHAN-1|L',
        class: 'L',
        seatAvailable: 9,
        fareADT: 2099000,
        taxADT: 569000,
        vatADT: 168000,
        issueFeeADT: 50000,
        currencyCode: 'VND',
        fareInfo: [
          {
            market: 'SGNHAN',
            class: 'L',
            cabinClass: 'Economy',
            fareBasis: 'LPXVNF',
          },
        ],
      },
    ],
  };
}

function ticketInfo(total: number | undefined) {
  return {
    data: {
      listPNR: [
        {
          airline: 'VN',
          pnr: 'PNR123',
          status: 'HELD',
          timelimit: '11-06-2026 23:50:00',
          ...(total === undefined ? {} : { total }),
        },
      ],
    },
  };
}
