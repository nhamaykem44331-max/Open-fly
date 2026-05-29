import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MUADI_PROVIDER } from './../src/integrations/muadi/muadi-provider.interface';
import { PrismaService } from './../src/prisma/prisma.service';

const EMAILS = ['profile-a@example.com', 'profile-b@example.com'];

describe('Profile (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MUADI_PROVIDER)
      .useValue({ search: jest.fn(), hold: jest.fn() })
      .compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('passenger CRUD + single-primary + owner isolation', async () => {
    const a = await createUser('profile-a@example.com');
    const b = await createUser('profile-b@example.com');
    const tokenA = `Bearer ${tokenFor(a)}`;

    const p1 = await request(app.getHttpServer())
      .post('/api/v1/me/passengers')
      .set('Authorization', tokenA)
      .send({ fullName: 'NGUYEN VAN A', isPrimary: true })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/me/passengers')
      .set('Authorization', tokenA)
      .send({ fullName: 'TRAN THI B', isPrimary: true })
      .expect(201);

    // p1 mất isPrimary (chỉ 1 primary).
    const list = await request(app.getHttpServer())
      .get('/api/v1/me/passengers')
      .set('Authorization', tokenA)
      .expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body.filter((p: { isPrimary: boolean }) => p.isPrimary)).toHaveLength(1);

    // b không sửa được passenger của a (404).
    await request(app.getHttpServer())
      .patch(`/api/v1/me/passengers/${p1.body.id}`)
      .set('Authorization', `Bearer ${tokenFor(b)}`)
      .send({ fullName: 'HACK' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/me/passengers/${p1.body.id}`)
      .set('Authorization', tokenA)
      .expect(200);
  });

  it('VAT profile create + notification prefs upsert (telegramChatId)', async () => {
    const a = await createUser('profile-a@example.com');
    const tokenA = `Bearer ${tokenFor(a)}`;

    await request(app.getHttpServer())
      .post('/api/v1/me/vat-profiles')
      .set('Authorization', tokenA)
      .send({ companyName: 'Cong ty ABC', taxId: '0312345678', address: 'HCM' })
      .expect(201);

    const prefs = await request(app.getHttpServer())
      .patch('/api/v1/me/notification-preferences')
      .set('Authorization', tokenA)
      .send({ telegramEnabled: true, telegramChatId: '123456', quietHoursStart: '22:00' })
      .expect(200);
    expect(prefs.body.telegramEnabled).toBe(true);
    expect(prefs.body.telegramChatId).toBe('123456');

    // MST sai định dạng -> 400.
    await request(app.getHttpServer())
      .post('/api/v1/me/vat-profiles')
      .set('Authorization', tokenA)
      .send({ companyName: 'X', taxId: 'abc', address: 'Y' })
      .expect(400);
  });

  function tokenFor(user: User): string {
    return jwtService.sign({ sub: user.id, role: user.role, tier: user.tier });
  }

  async function createUser(email: string): Promise<User> {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName: email },
    });
  }

  async function cleanup() {
    const users = await prisma.user.findMany({
      where: { email: { in: EMAILS } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length > 0) {
      await prisma.savedPassenger.deleteMany({ where: { userId: { in: ids } } });
      await prisma.savedVatProfile.deleteMany({ where: { userId: { in: ids } } });
      await prisma.notificationPreference.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  }
});
