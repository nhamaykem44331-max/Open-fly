import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus } from '@prisma/client';
import {
  HoldResult,
  IMuadiProvider,
  MuadiRawFare,
  MuadiRawFlight,
} from '../../integrations/muadi/muadi-provider.interface';
import { RedisService } from '../../integrations/redis/redis.service';
import { MarkupService } from '../../pricing/markup.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingService, parseTimelimit } from '../booking.service';
import { HoldBookingDto } from '../dto/hold-booking.dto';

describe('BookingService hold', () => {
  let provider: jest.Mocked<IMuadiProvider>;
  let prisma: {
    booking: { create: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let redis: jest.Mocked<Pick<RedisService, 'get'>>;
  let markup: jest.Mocked<
    Pick<MarkupService, 'classifyDomestic' | 'computeForFareClass'>
  >;
  let config: Pick<ConfigService, 'get'>;
  let service: BookingService;

  beforeEach(() => {
    provider = {
      search: jest.fn(),
      hold: jest.fn().mockResolvedValue(mockHoldResult()),
    };
    prisma = {
      booking: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'booking-id',
            ...data,
          }),
        ),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ tier: 'STANDARD' }),
      },
    };
    redis = {
      get: jest.fn().mockResolvedValue(mockSnapshot()),
    };
    markup = {
      classifyDomestic: jest.fn().mockResolvedValue(true),
      computeForFareClass: jest.fn().mockResolvedValue({
        ruleId: 'markup-rule-id',
        ruleName: 'Domestic 3.5%',
        markupAmount: 105000,
        sellPrice: 3105000,
        ruleSnapshot: {
          id: 'markup-rule-id',
          name: 'Domestic 3.5%',
        },
      }),
    };
    config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          PAYMENT_BUFFER_MINUTES: '60',
          MIN_PAYMENT_WINDOW_MINUTES: '15',
          MUADI_HOLD_FALLBACK_HOURS: '4',
        };

        return values[key];
      }),
    };
    service = new BookingService(
      provider,
      prisma as unknown as PrismaService,
      markup as unknown as MarkupService,
      redis as unknown as RedisService,
      config as ConfigService,
    );
  });

  it('returns a dry-run snapshot without calling Muadi hold', async () => {
    const result = (await service.hold(validDto(), {
      dryRun: true,
    })) as unknown as {
      dryRun: true;
      snapshot: Record<string, unknown>;
    };

    expect(provider.hold).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        dryRun: true,
        snapshot: expect.objectContaining({
          airline: 'VN',
          flightNumber: 'VN252',
          snapshotPriceVnd: 2886000,
        }),
      }),
    );
  });

  it('persists HELD booking with authoritative reconcile price and deadlines', async () => {
    await service.hold(validDto(), {
      userId: 'user-id',
      vat: {
        companyName: 'Công ty OpenFly',
        taxId: '0102030405',
        address: 'Hà Nội',
      },
    });

    expect(provider.hold).toHaveBeenCalledTimes(1);
    expect(provider.hold).toHaveBeenCalledWith(
      expect.objectContaining({
        fareClass: 'L',
        snapshot: expect.objectContaining({
          airline: 'VN',
          flightNumber: 'VN252',
          snapshotPriceVnd: 2886000,
        }),
      }),
    );
    const createArg = prisma.booking.create.mock.calls[0][0];
    expect(createArg.data).toEqual(
      expect.objectContaining({
        userId: 'user-id',
        status: BookingStatus.HELD,
        pnr: 'ABC123',
        sessionId: '654321',
        totalNetPrice: 3000000,
        totalSellPrice: 3105000,
        totalMarkup: 105000,
        appliedMarkupRuleId: 'markup-rule-id',
        tax: 0,
        fee: 0,
      }),
    );
    expect(markup.computeForFareClass).toHaveBeenCalledWith(
      expect.objectContaining({
        airlineCode: 'VN',
        channel: 'B2C',
        cabin: 'economy',
        domestic: true,
        tier: 'STANDARD',
        route: 'SGN-HAN',
        netPrice: 3000000,
      }),
    );
    expect(createArg.data.appliedMarkupRuleSnapshot).toEqual(
      expect.objectContaining({
        id: 'markup-rule-id',
      }),
    );
    expect(createArg.data.muadiHoldExpiresAt.toISOString()).toBe(
      '2026-06-11T16:50:00.000Z',
    );
    expect(createArg.data.paymentDeadline.toISOString()).toBe(
      '2026-06-11T15:50:00.000Z',
    );
    expect(createArg.data.pnrs.create).toEqual([
      expect.objectContaining({
        airline: 'VN',
        pnr: 'ABC123',
      }),
    ]);
    expect(createArg.data.timeline.create).toEqual(
      expect.objectContaining({
        eventType: 'HELD',
        title: 'Đã giữ chỗ thành công',
        payload: expect.objectContaining({
          pricing: expect.objectContaining({
            totalNetPrice: 3000000,
            snapshotPriceVnd: 2886000,
            priceChanged: false,
          }),
          markup: expect.objectContaining({
            ruleId: 'markup-rule-id',
            markupAmount: 105000,
            sellPrice: 3105000,
          }),
        }),
      }),
    );
  });

  it('does not persist when payment window is too short', async () => {
    provider.hold.mockResolvedValueOnce(
      mockHoldResult({
        timelimit: new Date(Date.now() + 70 * 60_000).toISOString(),
      }),
    );

    await expect(
      service.hold(validDto(), {
        userId: 'user-id',
      }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('records priceChanged when authoritative price differs by more than 5%', async () => {
    provider.hold.mockResolvedValueOnce(
      mockHoldResult({
        total: 3200000,
        priceChanged: true,
      }),
    );

    await service.hold(validDto(), {
      userId: 'user-id',
    });

    const createArg = prisma.booking.create.mock.calls[0][0];
    expect(createArg.data.totalNetPrice).toBe(3200000);
    expect(createArg.data.timeline.create.payload.pricing).toEqual(
      expect.objectContaining({
        totalNetPrice: 3200000,
        snapshotPriceVnd: 2886000,
        priceChanged: true,
      }),
    );
  });

  it('sets fallback hold expiry and payment deadline when PNR timelimit is missing', async () => {
    provider.hold.mockResolvedValueOnce(
      mockHoldResult({
        timelimit: null,
      }),
    );

    await service.hold(validDto(), {
      userId: 'user-id',
    });

    const createArg = prisma.booking.create.mock.calls[0][0];
    expect(createArg.data.muadiHoldExpiresAt).toBeInstanceOf(Date);
    expect(createArg.data.paymentDeadline).toBeInstanceOf(Date);
    expect(createArg.data.pnrs.create[0].timelimit).toBe(
      createArg.data.muadiHoldExpiresAt,
    );
  });

  it('computes payment deadline as timelimit minus 60 minutes', () => {
    const timelimit = parseTimelimit('11-06-2026 23:50:00');
    const paymentDeadline = new Date(timelimit!.getTime() - 60 * 60 * 1000);

    expect(paymentDeadline.toISOString()).toBe('2026-06-11T15:50:00.000Z');
  });
});

function validDto(): HoldBookingDto {
  return {
    offerId: 'offer-id',
    fareClass: 'L',
    passengers: [
      {
        title: 'MR',
        firstName: 'Anh',
        lastName: 'Vu',
        type: 'ADT',
      },
    ],
    contact: {
      phone: '+84938121234',
      email: 'guest@example.com',
    },
  };
}

function mockSnapshot() {
  return {
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
  };
}

function mockFlight(): MuadiRawFlight {
  return {
    id: 'SGNHAN-1',
    airline: 'VN',
    source: 'VN',
    from: 'SGN',
    to: 'HAN',
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
    priceInfo: [mockFare()],
  };
}

function mockFare(): MuadiRawFare {
  return {
    id: 'SGNHAN-1|Y',
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
  };
}

function mockHoldResult(
  overrides: {
    total?: number;
    timelimit?: string | null;
    priceChanged?: boolean;
  } = {},
): HoldResult {
  const total = overrides.total ?? 3000000;
  const timelimit =
    overrides.timelimit === null
      ? undefined
      : (overrides.timelimit ?? '11-06-2026 23:50:00');
  const flight = mockFlight();
  const fare = mockFare();

  return {
    bookingResponse: {
      success: true,
    },
    ticketInfo: {
      data: {
        listPNR: [
          {
            airline: 'VN',
            pnr: 'ABC123',
            status: 'HELD',
            ...(timelimit === undefined ? {} : { timelimit }),
            total,
          },
        ],
      },
    },
    protectionVerified: false,
    pnrs: [
      {
        airline: 'VN',
        pnr: 'ABC123',
        status: 'HELD',
        timelimit,
        total,
      },
    ],
    pricing: {
      verified: true,
      source: 'booking/ticket-info-by-id',
      totalNetPrice: total,
      currency: 'VND',
      byPnr: [
        {
          airline: 'VN',
          pnr: 'ABC123',
          status: 'HELD',
          timelimit,
          total,
        },
      ],
      syncedAt: '2026-06-11T09:00:00.000Z',
    },
    flight,
    fare,
    bookRequest: {
      sessionID: 654321,
      isExportNow: false,
    },
    muadiSessionId: 654321,
    snapshotPriceVnd: 2886000,
    priceChanged: overrides.priceChanged ?? false,
  };
}
