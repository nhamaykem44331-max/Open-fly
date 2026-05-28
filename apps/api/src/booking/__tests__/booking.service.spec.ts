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
      get: jest.fn().mockResolvedValue({
        rawFlight: mockFlight(),
        muadiSessionId: 123456,
        currencyCode: 'VND',
        searchParams: {
          origin: 'SGN',
          destination: 'HAN',
          date: '2026-06-11',
          paxAdt: 1,
          paxChd: 0,
          paxInf: 0,
        },
      }),
    };
    markup = {
      classifyDomestic: jest.fn().mockResolvedValue(true),
      computeForFareClass: jest.fn().mockResolvedValue({
        ruleId: 'markup-rule-id',
        ruleName: 'Domestic 3.5%',
        markupAmount: 101010,
        sellPrice: 2987010,
        ruleSnapshot: {
          id: 'markup-rule-id',
          name: 'Domestic 3.5%',
        },
      }),
    };
    service = new BookingService(
      provider,
      prisma as unknown as PrismaService,
      markup as unknown as MarkupService,
      redis as unknown as RedisService,
    );
  });

  it('builds a dry-run book request without calling Muadi hold', async () => {
    const result = (await service.hold(validDto(), {
      dryRun: true,
    })) as unknown as {
      dryRun: true;
      bookRequest: {
        listRoutes: Array<Record<string, unknown>>;
        listPax: Array<Record<string, unknown>>;
      } & Record<string, unknown>;
    };

    expect(provider.hold).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        dryRun: true,
        bookRequest: expect.objectContaining({
          sessionID: 123456,
          isExportNow: false,
          isReBook: false,
          adt: 1,
          chd: 0,
          inf: 0,
          currencyCode: 'VND',
        }),
      }),
    );
    expect(result.bookRequest.listRoutes[0]).toEqual(
      expect.objectContaining({
        airline: 'VN',
        from: 'SGN',
        to: 'HAN',
      }),
    );
    expect(result.bookRequest.listPax[0]).toEqual(
      expect.objectContaining({
        title: 'MR',
        firstName: 'ANH',
        lastName: 'VU',
        type: 'ADT',
      }),
    );
  });

  it('persists HELD booking with PNR and deadlines', async () => {
    await service.hold(validDto(), {
      userId: 'user-id',
      vat: {
        companyName: 'Công ty OpenFly',
        taxId: '0102030405',
        address: 'Hà Nội',
      },
    });

    expect(provider.hold).toHaveBeenCalledTimes(1);
    const createArg = prisma.booking.create.mock.calls[0][0];
    expect(createArg.data).toEqual(
      expect.objectContaining({
        userId: 'user-id',
        status: BookingStatus.HELD,
        pnr: 'ABC123',
        sessionId: '123456',
        totalNetPrice: 2886000,
        totalSellPrice: 2987010,
        totalMarkup: 101010,
        appliedMarkupRuleId: 'markup-rule-id',
        tax: 737000,
        fee: 50000,
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
        netPrice: 2886000,
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
          markup: expect.objectContaining({
            ruleId: 'markup-rule-id',
            markupAmount: 101010,
            sellPrice: 2987010,
          }),
        }),
      }),
    );
  });

  it('computes payment deadline as timelimit minus 60 minutes', () => {
    const timelimit = parseTimelimit('11-06-2026 23:50');
    const paymentDeadline = new Date(timelimit!.getTime() - 60 * 60 * 1000);

    expect(paymentDeadline.toISOString()).toBe('2026-06-11T15:50:00.000Z');
  });
});

function validDto(): HoldBookingDto {
  const flight = mockFlight();

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

function mockHoldResult(): HoldResult {
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
            timelimit: '11-06-2026 23:50',
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
        timelimit: '11-06-2026 23:50',
      },
    ],
  };
}
