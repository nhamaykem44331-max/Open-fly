import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, User, UserRole } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MUADI_PROVIDER } from './../src/integrations/muadi/muadi-provider.interface';
import { PrismaService } from './../src/prisma/prisma.service';

const EMAILS = ['lookup-adm@example.com', 'lookup-cust@example.com'];
const ORDER = 'OFYLOOKUPTEST';
const PNR = 'LKUPXX';

describe('Admin booking lookup (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let bookingId: string;
  let customerId: string;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MUADI_PROVIDER)
      .useValue({ search: jest.fn(), hold: jest.fn() })
      .compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    await cleanup();
    await seed();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const tokenFor = (u: Pick<User, 'id' | 'role' | 'tier'>) => jwt.sign({ sub: u.id, role: u.role, tier: u.tier });

  it('rejects search from a non-ADMIN (403)', async () => {
    const cust = await prisma.user.findUniqueOrThrow({ where: { email: 'lookup-cust@example.com' } });
    await request(app.getHttpServer())
      .get('/api/v1/admin/bookings/search?q=OFY')
      .set('Authorization', `Bearer ${tokenFor(cust)}`)
      .expect(403);
  });

  it('finds a booking by orderCode and by PNR', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'lookup-adm@example.com' } });
    const token = tokenFor(admin);

    const byOrder = await request(app.getHttpServer())
      .get(`/api/v1/admin/bookings/search?q=${ORDER}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(byOrder.body.items.some((b: { orderCode: string }) => b.orderCode === ORDER)).toBe(true);

    const byPnr = await request(app.getHttpServer())
      .get(`/api/v1/admin/bookings/search?q=${PNR}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(byPnr.body.items.some((b: { orderCode: string }) => b.orderCode === ORDER)).toBe(true);
  });

  it('returns full detail (price, timeline, passengers, payments)', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'lookup-adm@example.com' } });
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .expect(200);
    expect(res.body.orderCode).toBe(ORDER);
    expect(res.body.price.total).toBe(1_200_000);
    expect(res.body.price.markup).toBe(200_000);
    expect(Array.isArray(res.body.timeline)).toBe(true);
    expect(res.body.passengers.length).toBe(1);
    expect(res.body.pnrs[0].pnr).toBe(PNR);
    expect(res.body.user.id).toBe(customerId);
  });

  it('404 for an unknown booking id', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'lookup-adm@example.com' } });
    await request(app.getHttpServer())
      .get('/api/v1/admin/bookings/does-not-exist')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .expect(404);
  });

  async function seed() {
    await prisma.user.create({ data: { email: 'lookup-adm@example.com', fullName: 'Lookup Admin', role: UserRole.ADMIN } });
    const cust = await prisma.user.create({
      data: { email: 'lookup-cust@example.com', fullName: 'Khach Tra Cuu', phone: '+84900000077', role: UserRole.CUSTOMER },
    });
    customerId = cust.id;
    const booking = await prisma.booking.create({
      data: {
        orderCode: ORDER,
        userId: cust.id,
        status: BookingStatus.PAID,
        airline: 'VN',
        flightNumber: 'VN123',
        fromCode: 'SGN',
        toCode: 'HAN',
        departTime: new Date('2026-07-01T03:00:00.000Z'),
        totalNetPrice: 1_000_000,
        totalSellPrice: 1_200_000,
        totalMarkup: 200_000,
        tax: 100_000,
        fee: 50_000,
        contactEmail: 'lookup-cust@example.com',
        contactPhone: '+84900000077',
        pnrs: { create: [{ airline: 'VN', pnr: PNR }] },
        passengers: { create: [{ fullName: 'Nguyen Van A', gender: 'Nam', isChild: false }] },
        timeline: { create: [{ eventType: 'CREATED', title: 'Tạo đơn', payload: {}, occurredAt: new Date() }] },
      },
    });
    bookingId = booking.id;
  }

  async function cleanup() {
    const bk = await prisma.booking.findUnique({ where: { orderCode: ORDER }, select: { id: true } });
    if (bk) {
      await prisma.bookingTimelineEvent.deleteMany({ where: { bookingId: bk.id } });
      await prisma.bookingPassenger.deleteMany({ where: { bookingId: bk.id } });
      await prisma.bookingPnr.deleteMany({ where: { bookingId: bk.id } });
      await prisma.payment.deleteMany({ where: { bookingId: bk.id } });
      await prisma.booking.delete({ where: { id: bk.id } });
    }
    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
  }
});
