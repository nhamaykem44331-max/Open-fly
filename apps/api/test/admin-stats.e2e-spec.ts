import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MUADI_PROVIDER } from './../src/integrations/muadi/muadi-provider.interface';
import { PrismaService } from './../src/prisma/prisma.service';

const EMAILS = ['stats-adm@example.com', 'stats-cust@example.com'];

describe('Admin stats (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

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
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const tokenFor = (u: User) => jwt.sign({ sub: u.id, role: u.role, tier: u.tier });
  const mkUser = (email: string, role: UserRole) =>
    prisma.user.upsert({ where: { email }, update: { role }, create: { email, fullName: email, role } });

  it('rejects a non-ADMIN account (403)', async () => {
    const cust = await mkUser('stats-cust@example.com', UserRole.CUSTOMER);
    await request(app.getHttpServer())
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${tokenFor(cust)}`)
      .expect(403);
  });

  it('returns the operational snapshot for an ADMIN', async () => {
    const admin = await mkUser('stats-adm@example.com', UserRole.ADMIN);
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .expect(200);

    const b = res.body;
    for (const k of [
      'pendingTickets',
      'pendingTicketsUrgent',
      'issueFailed',
      'bookingsToday',
      'revenueToday',
      'huntsRunning',
      'sessionHealthy',
      'sessionTotal',
      'paymentsReview',
      'refundsOpen',
    ]) {
      expect(typeof b[k]).toBe('number');
    }
    expect(Array.isArray(b.soonExpiring)).toBe(true);
    // counts are non-negative; urgent never exceeds total pending
    expect(b.pendingTickets).toBeGreaterThanOrEqual(0);
    expect(b.pendingTicketsUrgent).toBeLessThanOrEqual(b.pendingTickets);
  });

  async function cleanup() {
    await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
  }
});
