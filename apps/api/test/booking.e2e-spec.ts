import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, User } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { offerSnapshotKey } from './../src/flights/offer-snapshot';
import {
  HoldResult,
  IMuadiProvider,
  MUADI_PROVIDER,
  MuadiRawFlight,
} from './../src/integrations/muadi/muadi-provider.interface';
import { RedisService } from './../src/integrations/redis/redis.service';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Booking endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let jwtService: JwtService;
  let provider: jest.Mocked<IMuadiProvider>;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';

    provider = {
      search: jest.fn(),
      hold: jest.fn().mockResolvedValue(mockHoldResult()),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MUADI_PROVIDER)
      .useValue(provider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
    jwtService = app.get(JwtService);
    await cleanup();
  });

  beforeEach(async () => {
    provider.hold.mockClear();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('holds booking with JWT, snapshot, and Idempotency-Key', async () => {
    const user = await createUser('hold-user@example.com');
    await seedSnapshot('e2e-offer-1');

    const response = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .set('Idempotency-Key', 'hold-key-1')
      .send(holdBody('e2e-offer-1'))
      .expect(201);

    expect(response.body.status).toBe(BookingStatus.HELD);
    expect(response.body.pnr).toBe('E2EPNR');
    expect(response.body.totalSellPrice).toBeGreaterThan(0);
    expect(provider.hold).toHaveBeenCalledTimes(1);

    const booking = await prisma.booking.findUniqueOrThrow({
      where: {
        id: response.body.id,
      },
    });
    expect(booking.userId).toBe(user.id);
    expect(booking.vatCompanyName).toBeNull();
  });

  it('requires JWT for hold', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .set('Idempotency-Key', 'hold-key-no-jwt')
      .send(holdBody('missing-offer'))
      .expect(401);
  });

  it('returns 410 when offer snapshot is missing', async () => {
    const user = await createUser('snapshot-miss@example.com');

    await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .set('Idempotency-Key', 'hold-key-missing-snapshot')
      .send(holdBody('missing-offer'))
      .expect(410)
      .expect(({ body }) => {
        expect(body.message).toBe('Vé đã hết hạn giữ, vui lòng tìm lại');
      });
  });

  it('returns cached booking for repeated Idempotency-Key', async () => {
    const user = await createUser('idempotent@example.com');
    await seedSnapshot('e2e-offer-2');

    const first = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .set('Idempotency-Key', 'same-hold-key')
      .send(holdBody('e2e-offer-2'))
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .set('Idempotency-Key', 'same-hold-key')
      .send(holdBody('e2e-offer-2'))
      .expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(provider.hold).toHaveBeenCalledTimes(1);
    await expect(
      prisma.booking.count({
        where: {
          userId: user.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it('rejects detail access from another user', async () => {
    const owner = await createUser('owner@example.com');
    const other = await createUser('other@example.com');
    await seedSnapshot('e2e-offer-3');

    const hold = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${tokenFor(owner)}`)
      .set('Idempotency-Key', 'owner-hold-key')
      .send(holdBody('e2e-offer-3'))
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/bookings/${hold.body.id}`)
      .set('Authorization', `Bearer ${tokenFor(other)}`)
      .expect(403);
  });

  it('lists only current user bookings', async () => {
    const user = await createUser('list-user@example.com');
    const other = await createUser('list-other@example.com');
    await seedSnapshot('e2e-offer-4');

    const own = await request(app.getHttpServer())
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .set('Idempotency-Key', 'list-hold-key')
      .send(holdBody('e2e-offer-4'))
      .expect(201);
    await createDirectBooking(other.id, 'OTHERLIST');

    const list = await request(app.getHttpServer())
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .expect(200);

    expect(list.body.items.map((item: { id: string }) => item.id)).toEqual([
      own.body.id,
    ]);
  });

  async function seedSnapshot(offerId: string) {
    await redis.set(
      offerSnapshotKey(offerId),
      {
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
      900,
    );
  }

  async function createUser(email: string): Promise<User> {
    return prisma.user.create({
      data: {
        email,
        fullName: email,
      },
    });
  }

  function tokenFor(user: User): string {
    return jwtService.sign({
      sub: user.id,
      role: user.role,
      tier: user.tier,
    });
  }

  function holdBody(offerId: string) {
    return {
      offerId,
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

  async function createDirectBooking(userId: string, orderCode: string) {
    return prisma.booking.create({
      data: {
        orderCode,
        userId,
        status: BookingStatus.HELD,
        fromCode: 'SGN',
        toCode: 'HAN',
        departTime: new Date('2026-06-11T09:40:00.000Z'),
        totalNetPrice: 1000000,
        totalSellPrice: 1000000,
        vatCompanyName: null,
        vatTaxId: null,
        vatAddress: null,
        contactEmail: 'other@example.com',
        contactPhone: '+84938121234',
      },
    });
  }

  async function cleanup() {
    await redis.del(offerSnapshotKey('e2e-offer-1')).catch(() => undefined);
    await redis.del(offerSnapshotKey('e2e-offer-2')).catch(() => undefined);
    await redis.del(offerSnapshotKey('e2e-offer-3')).catch(() => undefined);
    await redis.del(offerSnapshotKey('e2e-offer-4')).catch(() => undefined);
    await redis.del('idempotency:booking-hold:*').catch(() => undefined);

    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'hold-user@example.com',
            'snapshot-miss@example.com',
            'idempotent@example.com',
            'owner@example.com',
            'other@example.com',
            'list-user@example.com',
            'list-other@example.com',
          ],
        },
      },
      select: {
        id: true,
      },
    });
    const userIds = users.map((user) => user.id);
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          {
            userId: {
              in: userIds,
            },
          },
          {
            orderCode: 'OTHERLIST',
          },
        ],
      },
      select: {
        id: true,
      },
    });
    const bookingIds = bookings.map((booking) => booking.id);
    const intents = await prisma.paymentIntent.findMany({
      where: {
        bookingId: {
          in: bookingIds,
        },
      },
      select: {
        id: true,
      },
    });
    const intentIds = intents.map((intent) => intent.id);

    await prisma.bankTransaction.deleteMany({
      where: {
        matchedIntentId: {
          in: intentIds,
        },
      },
    });
    await prisma.payment.deleteMany({
      where: {
        bookingId: {
          in: bookingIds,
        },
      },
    });
    await prisma.paymentIntent.deleteMany({
      where: {
        bookingId: {
          in: bookingIds,
        },
      },
    });
    await prisma.booking.deleteMany({
      where: {
        id: {
          in: bookingIds,
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });
  }
});

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

function mockHoldResult(): HoldResult {
  const flight = mockFlight();
  const fare = flight.priceInfo![0];
  const total = 2886000;
  const timelimit = '11-06-2026 23:50:00';

  return {
    bookingResponse: {
      success: true,
    },
    ticketInfo: {
      data: {
        listPNR: [
          {
            airline: 'VN',
            pnr: 'E2EPNR',
            status: 'HELD',
            timelimit,
            total,
          },
        ],
      },
    },
    protectionVerified: false,
    pnrs: [
      {
        airline: 'VN',
        pnr: 'E2EPNR',
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
          pnr: 'E2EPNR',
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
    snapshotPriceVnd: total,
    priceChanged: false,
  };
}
