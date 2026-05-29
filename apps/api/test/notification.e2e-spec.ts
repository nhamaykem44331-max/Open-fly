import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MUADI_PROVIDER } from './../src/integrations/muadi/muadi-provider.interface';
import { PrismaService } from './../src/prisma/prisma.service';

const EMAILS = ['notif-owner@example.com', 'notif-other@example.com'];

describe('Notification inbox (e2e)', () => {
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

  it('list + unread filter + mark read + read-all; owner isolation', async () => {
    const owner = await createUser('notif-owner@example.com');
    const other = await createUser('notif-other@example.com');
    const token = `Bearer ${tokenFor(owner)}`;

    const n1 = await seedNotif(owner.id, 'HUNT_FOUND', 'Tìm thấy vé');
    await seedNotif(owner.id, 'HUNT_PROGRESS', 'Giá giảm');
    await seedNotif(other.id, 'SYSTEM', 'Của người khác');

    // List: chỉ thấy 2 của owner, unreadCount=2.
    const list = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', token)
      .expect(200);
    expect(list.body.items).toHaveLength(2);
    expect(list.body.unreadCount).toBe(2);

    // Mark 1 read.
    await request(app.getHttpServer())
      .post(`/api/v1/notifications/${n1.id}/read`)
      .set('Authorization', token)
      .expect(200);

    // Unread filter -> còn 1.
    const unread = await request(app.getHttpServer())
      .get('/api/v1/notifications?unread=true')
      .set('Authorization', token)
      .expect(200);
    expect(unread.body.items).toHaveLength(1);

    // Không đọc được notif của người khác (404).
    const otherNotif = await prisma.notification.findFirstOrThrow({
      where: { userId: other.id },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/notifications/${otherNotif.id}/read`)
      .set('Authorization', token)
      .expect(404);

    // Read-all -> 1 còn lại được đọc.
    const readAll = await request(app.getHttpServer())
      .post('/api/v1/notifications/read-all')
      .set('Authorization', token)
      .expect(200);
    expect(readAll.body.updated).toBe(1);
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

  function seedNotif(userId: string, kind: string, title: string) {
    return prisma.notification.create({
      data: { userId, kind: kind as never, title, body: title },
    });
  }

  async function cleanup() {
    const users = await prisma.user.findMany({
      where: { email: { in: EMAILS } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length > 0) {
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  }
});
