import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
  User,
  UserRole,
} from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Admin booking ticketing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    jwtService = app.get(JwtService);
    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('marks a paid booking as ticketed and saves ticket numbers', async () => {
    const admin = await createUser('admin-ticketed@example.com', UserRole.ADMIN);
    const customer = await createUser('customer-ticketed@example.com');
    const booking = await createBooking(customer.id, {
      status: BookingStatus.PAID,
      orderCode: 'ADMTEST001',
      pnr: 'ADM001',
    });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${booking.id}/mark-ticketed`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        ticketNumbers: [
          {
            pnr: 'ADM001',
            ticketNumber: '7381234567890',
          },
        ],
        notes: 'Xuất vé qua Zalo Nam Thanh',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe(BookingStatus.TICKETED);
        expect(body.pnrs[0].ticketNumber).toBe('7381234567890');
      });

    const updated = await prisma.booking.findUniqueOrThrow({
      where: {
        id: booking.id,
      },
      include: {
        pnrs: true,
      },
    });
    const timeline = await prisma.bookingTimelineEvent.findFirstOrThrow({
      where: {
        bookingId: booking.id,
        eventType: 'TICKETED',
      },
    });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: {
        entity: 'Booking',
        entityId: booking.id,
        action: 'booking.mark_ticketed',
      },
    });

    expect(updated.status).toBe(BookingStatus.TICKETED);
    expect(updated.pnrs[0].ticketNumber).toBe('7381234567890');
    expect(timeline.title).toBe('Đã ghi nhận xuất vé');
    expect(audit.actorId).toBe(admin.id);
  });

  it('rejects mark-ticketed when booking is not paid', async () => {
    const admin = await createUser('admin-held@example.com', UserRole.ADMIN);
    const customer = await createUser('customer-held@example.com');
    const booking = await createBooking(customer.id, {
      status: BookingStatus.HELD,
      orderCode: 'ADMTEST002',
      pnr: 'ADM002',
    });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${booking.id}/mark-ticketed`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        ticketNumbers: [
          {
            pnr: 'ADM002',
            ticketNumber: '7381234567891',
          },
        ],
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body.message).toBe('Booking chưa thanh toán hoặc đã xử lý');
      });
  });

  it('rejects mark-ticketed from a customer account', async () => {
    const customer = await createUser('customer-rbac@example.com');
    const booking = await createBooking(customer.id, {
      status: BookingStatus.PAID,
      orderCode: 'ADMTEST003',
      pnr: 'ADM003',
    });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${booking.id}/mark-ticketed`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({
        ticketNumbers: [
          {
            pnr: 'ADM003',
            ticketNumber: '7381234567892',
          },
        ],
      })
      .expect(403);
  });

  it('marks paid booking as issue failed with reason', async () => {
    const admin = await createUser('admin-failed@example.com', UserRole.ADMIN);
    const customer = await createUser('customer-failed@example.com');
    const booking = await createBooking(customer.id, {
      status: BookingStatus.PAID,
      orderCode: 'ADMTEST004',
      pnr: 'ADM004',
    });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${booking.id}/mark-issue-failed`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        reason: 'Nam Thanh báo hãng hết quota xuất vé',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe(BookingStatus.ISSUE_FAILED);
      });

    const timeline = await prisma.bookingTimelineEvent.findFirstOrThrow({
      where: {
        bookingId: booking.id,
        eventType: 'ISSUE_FAILED',
      },
    });
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: {
        entity: 'Booking',
        entityId: booking.id,
        action: 'booking.mark_issue_failed',
      },
    });

    expect(timeline.payload).toMatchObject({
      reason: 'Nam Thanh báo hãng hết quota xuất vé',
    });
    expect(audit.afterJson).toMatchObject({
      status: BookingStatus.ISSUE_FAILED,
      reason: 'Nam Thanh báo hãng hết quota xuất vé',
    });
  });

  it('lists only paid bookings sorted by hold expiry', async () => {
    const admin = await createUser('admin-list@example.com', UserRole.ADMIN);
    const customer = await createUser('customer-list@example.com');
    const later = await createBooking(customer.id, {
      status: BookingStatus.PAID,
      orderCode: 'ADMTEST005',
      pnr: 'ADM005',
      muadiHoldExpiresAt: new Date('2026-06-11T15:00:00.000Z'),
    });
    const earlier = await createBooking(customer.id, {
      status: BookingStatus.PAID,
      orderCode: 'ADMTEST006',
      pnr: 'ADM006',
      muadiHoldExpiresAt: new Date('2026-06-11T12:00:00.000Z'),
    });
    await createBooking(customer.id, {
      status: BookingStatus.TICKETED,
      orderCode: 'ADMTEST007',
      pnr: 'ADM007',
      muadiHoldExpiresAt: new Date('2026-06-11T10:00:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/bookings?status=PAID')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .expect(200);

    expect(response.body.items.map((item: { id: string }) => item.id)).toEqual(
      [earlier.id, later.id],
    );
    expect(response.body.items[0]).toMatchObject({
      orderCode: 'ADMTEST006',
      pnr: ['ADM006'],
      airline: 'VN',
      route: 'SGN-HAN',
      totalSellPrice: 1500000,
    });
    expect(response.body.items[0].paidAt).toBeTruthy();
  });

  async function createUser(
    email: string,
    role: UserRole = UserRole.CUSTOMER,
  ): Promise<User> {
    return prisma.user.create({
      data: {
        email,
        fullName: email,
        role,
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

  async function createBooking(
    userId: string,
    overrides: {
      status: BookingStatus;
      orderCode: string;
      pnr: string;
      muadiHoldExpiresAt?: Date;
    },
  ) {
    const booking = await prisma.booking.create({
      data: {
        orderCode: overrides.orderCode,
        userId,
        status: overrides.status,
        pnr: overrides.pnr,
        airline: 'VN',
        flightNumber: 'VN252',
        fromCode: 'SGN',
        toCode: 'HAN',
        departTime: new Date('2026-06-11T09:40:00.000Z'),
        arriveTime: new Date('2026-06-11T11:50:00.000Z'),
        totalNetPrice: 1450000,
        totalSellPrice: 1500000,
        totalMarkup: 50000,
        vatCompanyName: null,
        vatTaxId: null,
        vatAddress: null,
        contactEmail: 'admin-booking-test@example.com',
        contactPhone: '+84938121234',
        muadiHoldExpiresAt:
          overrides.muadiHoldExpiresAt ??
          new Date('2026-06-11T14:00:00.000Z'),
        paymentDeadline: new Date('2026-06-11T13:00:00.000Z'),
        pnrs: {
          create: {
            airline: 'VN',
            pnr: overrides.pnr,
            timelimit:
              overrides.muadiHoldExpiresAt ??
              new Date('2026-06-11T14:00:00.000Z'),
          },
        },
      },
    });

    if (overrides.status === BookingStatus.PAID) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: PaymentProvider.SEPAY,
          amount: 1500000,
          status: PaymentStatus.PAID,
          paidAt: new Date('2026-06-11T08:00:00.000Z'),
          transactionRef: `ADM-${overrides.orderCode}`,
        },
      });
    }

    return booking;
  }

  async function cleanup() {
    const bookings = await prisma.booking.findMany({
      where: {
        orderCode: {
          startsWith: 'ADMTEST',
        },
      },
      select: {
        id: true,
      },
    });
    const bookingIds = bookings.map((booking) => booking.id);

    await prisma.auditLog.deleteMany({
      where: {
        entity: 'Booking',
        entityId: {
          in: bookingIds,
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
    await prisma.bookingTimelineEvent.deleteMany({
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
        email: {
          in: [
            'admin-ticketed@example.com',
            'customer-ticketed@example.com',
            'admin-held@example.com',
            'customer-held@example.com',
            'customer-rbac@example.com',
            'admin-failed@example.com',
            'customer-failed@example.com',
            'admin-list@example.com',
            'customer-list@example.com',
          ],
        },
      },
    });
  }
});
