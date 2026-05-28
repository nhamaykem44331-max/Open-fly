import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, PaymentProvider } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('SePay payment flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
    process.env.SEPAY_BANK_ACCOUNT = '123456789';
    process.env.SEPAY_BANK_CODE = 'VCB';
    process.env.SEPAY_BANK_ACCOUNT_NAME = 'OPENFLY TEST';
    process.env.SEPAY_QR_TEMPLATE = 'compact';
    process.env.SEPAY_WEBHOOK_API_KEY = 'test-sepay-key';
    process.env.SEPAY_SKIP_IP_CHECK = 'true';
    process.env.SEPAY_INTENT_TTL_MINUTES = '15';

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
    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('creates SePay intent and moves booking to PAYMENT_PENDING', async () => {
    const booking = await createBooking();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/payment/sepay`)
      .set('Idempotency-Key', 'create-intent-1')
      .expect(200);

    expect(response.body.qrUrl).toContain('https://qr.sepay.vn/img?');
    expect(response.body.qrUrl).toContain('amount=1500000');
    expect(response.body.qrUrl).toContain(
      `OPENFLY${response.body.intent.providerOrderCode}`,
    );
    expect(response.body.intent.amount).toBe(1500000);

    const updated = await prisma.booking.findUniqueOrThrow({
      where: {
        id: booking.id,
      },
    });
    expect(updated.status).toBe(BookingStatus.PAYMENT_PENDING);
  });

  it('rejects create intent for non-payable booking', async () => {
    const booking = await createBooking({
      status: BookingStatus.PAID,
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/payment/sepay`)
      .expect(409);
  });

  it('matches exact payment, marks booking PAID, and dedupes replay', async () => {
    const booking = await createBooking();
    const intent = await createIntent(booking.id);
    const payload = webhookPayload(
      intent.providerOrderCode,
      intent.amount,
      'paytest-paid',
    );

    const first = await postWebhook(payload).expect(200);
    expect(first.body.status).toBe('PAID');

    const paidBooking = await prisma.booking.findUniqueOrThrow({
      where: {
        id: booking.id,
      },
    });
    const paymentCount = await prisma.payment.count({
      where: {
        bookingId: booking.id,
      },
    });
    const bankTx = await prisma.bankTransaction.findUniqueOrThrow({
      where: {
        dedupeKey: 'SEPAY:paytest-paid:1500000',
      },
    });
    expect(paidBooking.status).toBe(BookingStatus.PAID);
    expect(paymentCount).toBe(1);
    expect(bankTx.status).toBe('MATCHED');

    const second = await postWebhook(payload).expect(200);
    expect(second.body.status).toBe('DUPLICATE');
    await expect(
      prisma.payment.count({
        where: {
          bookingId: booking.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it('classifies partial and keeps intent pending', async () => {
    const booking = await createBooking();
    const intent = await createIntent(booking.id);

    const response = await postWebhook(
      webhookPayload(intent.providerOrderCode, 1000000, 'paytest-partial'),
    ).expect(200);

    const updatedIntent = await prisma.paymentIntent.findUniqueOrThrow({
      where: {
        id: intent.id,
      },
    });
    const bankTx = await prisma.bankTransaction.findUniqueOrThrow({
      where: {
        dedupeKey: 'SEPAY:paytest-partial:1000000',
      },
    });
    expect(response.body.status).toBe('PARTIAL');
    expect(updatedIntent.status).toBe('PENDING');
    expect(bankTx.status).toBe('PARTIAL');
  });

  it('classifies overpaid transfer as manual review', async () => {
    const booking = await createBooking();
    const intent = await createIntent(booking.id);

    const response = await postWebhook(
      webhookPayload(intent.providerOrderCode, 1600000, 'paytest-overpaid'),
    ).expect(200);

    const bankTx = await prisma.bankTransaction.findUniqueOrThrow({
      where: {
        dedupeKey: 'SEPAY:paytest-overpaid:1600000',
      },
    });
    expect(response.body.status).toBe('OVERPAID');
    expect(bankTx.status).toBe('MANUAL_REVIEW');
  });

  it('classifies missing intent and expired booking as manual review', async () => {
    const missingIntent = await postWebhook(
      webhookPayload('1760000000999', 1500000, 'paytest-missing-intent'),
    ).expect(200);
    expect(missingIntent.body.status).toBe('INTENT_NOT_FOUND');

    const booking = await createBooking();
    const intent = await createIntent(booking.id);
    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        paymentDeadline: new Date(Date.now() - 60_000),
      },
    });

    const expired = await postWebhook(
      webhookPayload(
        intent.providerOrderCode,
        intent.amount,
        'paytest-expired-booking',
      ),
    ).expect(200);
    expect(expired.body.status).toBe('BOOKING_NOT_PAYABLE');
  });

  async function createIntent(bookingId: string) {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/payment/sepay`)
      .expect(200);

    return response.body.intent as {
      id: string;
      providerOrderCode: string;
      amount: number;
    };
  }

  function postWebhook(payload: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post('/api/v1/webhooks/sepay')
      .set('Authorization', 'Apikey test-sepay-key')
      .send(payload);
  }

  async function createBooking(
    overrides: Partial<{
      status: BookingStatus;
      paymentDeadline: Date;
      totalSellPrice: number;
    }> = {},
  ) {
    const user = await prisma.user.create({
      data: {
        email: `payment-test-${Date.now()}-${Math.random()}@example.com`,
        fullName: 'Payment Test User',
      },
    });

    return prisma.booking.create({
      data: {
        orderCode: `PAYTEST${Date.now()}${Math.floor(Math.random() * 1000)}`,
        userId: user.id,
        status: overrides.status ?? BookingStatus.HELD,
        fromCode: 'SGN',
        toCode: 'HAN',
        departTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalNetPrice: 1450000,
        totalSellPrice: overrides.totalSellPrice ?? 1500000,
        totalMarkup: 50000,
        vatCompanyName: 'Công ty OpenFly Test',
        vatTaxId: '0102030405',
        vatAddress: 'Hà Nội',
        contactEmail: 'payment-test@example.com',
        contactPhone: '+84938121234',
        paymentDeadline:
          overrides.paymentDeadline ??
          new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });
  }

  function webhookPayload(
    providerOrderCode: string,
    amount: number,
    id: string,
  ) {
    return {
      id,
      gateway: 'SIMULATOR',
      transactionDate: '2026-06-11 16:40:00',
      accountNumber: '123456789',
      subAccount: null,
      transferType: 'in',
      transferAmount: amount,
      accumulated: amount,
      code: null,
      content: `OPENFLY${providerOrderCode}`,
      referenceCode: `SIM-${id}`,
      description: `OPENFLY${providerOrderCode}`,
    };
  }

  async function cleanup() {
    const bookings = await prisma.booking.findMany({
      where: {
        orderCode: {
          startsWith: 'PAYTEST',
        },
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
        OR: [
          {
            dedupeKey: {
              startsWith: 'SEPAY:paytest',
            },
          },
          {
            matchedIntentId: {
              in: intentIds,
            },
          },
        ],
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
          startsWith: 'payment-test-',
        },
      },
    });
  }
});
