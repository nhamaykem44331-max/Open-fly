import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { HuntStatus, User } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MUADI_PROVIDER } from './../src/integrations/muadi/muadi-provider.interface';
import { PrismaService } from './../src/prisma/prisma.service';

// RUN_WORKERS=false được set ở test/jest-e2e-setup.ts (trước khi nạp module)
// nên job hunt.run chỉ được enqueue, không bị processor tiêu thụ trong test.

const EMAILS = [
  'hunt-create@example.com',
  'hunt-quota@example.com',
  'hunt-owner@example.com',
  'hunt-other@example.com',
];

describe('Hunt endpoints (e2e)', () => {
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

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('từ chối khi không có token (JWT guard global)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/hunts')
      .set('Idempotency-Key', 'k1')
      .send(huntBody())
      .expect(401);
  });

  it('từ chối khi thiếu Idempotency-Key', async () => {
    const user = await createUser('hunt-create@example.com');
    await request(app.getHttpServer())
      .post('/api/v1/hunts')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send(huntBody())
      .expect(400);
  });

  it('tạo hunt hợp lệ + idempotent theo Idempotency-Key', async () => {
    const user = await createUser('hunt-create@example.com');
    const token = `Bearer ${tokenFor(user)}`;

    const first = await request(app.getHttpServer())
      .post('/api/v1/hunts')
      .set('Authorization', token)
      .set('Idempotency-Key', 'create-1')
      .send(huntBody())
      .expect(201);
    expect(first.body.status).toBe(HuntStatus.HUNTING);

    // Lặp cùng key -> trả cùng kết quả, không tạo hunt thứ 2.
    const second = await request(app.getHttpServer())
      .post('/api/v1/hunts')
      .set('Authorization', token)
      .set('Idempotency-Key', 'create-1')
      .send(huntBody())
      .expect(201);
    expect(second.body.id).toBe(first.body.id);

    const count = await prisma.hunt.count({ where: { userId: user.id } });
    expect(count).toBe(1);
  });

  it('chặn vượt quota tier STANDARD (max 3 hunt đang chạy)', async () => {
    const user = await createUser('hunt-quota@example.com');
    const token = `Bearer ${tokenFor(user)}`;

    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/hunts')
        .set('Authorization', token)
        .set('Idempotency-Key', `quota-${i}`)
        .send(huntBody())
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/api/v1/hunts')
      .set('Authorization', token)
      .set('Idempotency-Key', 'quota-over')
      .send(huntBody())
      .expect(409);
  });

  it('pause rồi cancel hunt; chỉ chủ sở hữu thấy', async () => {
    const owner = await createUser('hunt-owner@example.com');
    const other = await createUser('hunt-other@example.com');
    const ownerToken = `Bearer ${tokenFor(owner)}`;

    const created = await request(app.getHttpServer())
      .post('/api/v1/hunts')
      .set('Authorization', ownerToken)
      .set('Idempotency-Key', 'lifecycle-1')
      .send(huntBody())
      .expect(201);
    const huntId = created.body.id;

    // Người khác không thấy hunt này.
    const otherList = await request(app.getHttpServer())
      .get('/api/v1/hunts')
      .set('Authorization', `Bearer ${tokenFor(other)}`)
      .expect(200);
    expect(otherList.body).toHaveLength(0);

    // Pause.
    await request(app.getHttpServer())
      .patch(`/api/v1/hunts/${huntId}`)
      .set('Authorization', ownerToken)
      .send({ action: 'pause' })
      .expect(200);
    let hunt = await prisma.hunt.findUniqueOrThrow({ where: { id: huntId } });
    expect(hunt.status).toBe(HuntStatus.PAUSED);

    // Cancel.
    await request(app.getHttpServer())
      .delete(`/api/v1/hunts/${huntId}`)
      .set('Authorization', ownerToken)
      .expect(200);
    hunt = await prisma.hunt.findUniqueOrThrow({ where: { id: huntId } });
    expect(hunt.status).toBe(HuntStatus.CANCELLED);
  });

  function huntBody() {
    return {
      fromCode: 'HAN',
      toCode: 'SGN',
      flexibility: 'EXACT_DATE',
      windowStart: '2026-06-20',
      windowEnd: '2026-06-20',
      targetPrice: 1_500_000,
    };
  }

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
    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      await prisma.hunt.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  }
});
