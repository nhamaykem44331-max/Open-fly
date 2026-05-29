import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MUADI_PROVIDER } from './../src/integrations/muadi/muadi-provider.interface';
import { PrismaService } from './../src/prisma/prisma.service';

const EMAILS = ['admin-adm@example.com', 'admin-cust@example.com', 'admin-target@example.com'];

describe('Admin user management (e2e)', () => {
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

  it('RBAC + block (revoke tokens) + audit log', async () => {
    const admin = await createUser('admin-adm@example.com', UserRole.ADMIN);
    const cust = await createUser('admin-cust@example.com', UserRole.CUSTOMER);
    const target = await createUser('admin-target@example.com', UserRole.CUSTOMER);

    // Customer không được vào admin.
    await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${tokenFor(cust)}`)
      .expect(403);

    // Admin list được.
    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .expect(200);
    expect(list.body.items.length).toBeGreaterThanOrEqual(3);

    // Seed 1 refresh token cho target để kiểm tra revoke.
    await prisma.refreshToken.create({
      data: {
        userId: target.id,
        tokenHash: `hash-${target.id}`,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });

    // Block target.
    const blocked = await request(app.getHttpServer())
      .post(`/api/v1/admin/users/${target.id}/block`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ reason: 'Vi phạm điều khoản' })
      .expect(200);
    expect(blocked.body.blocked).toBe(true);

    const dbTarget = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(dbTarget.blocked).toBe(true);
    const activeTokens = await prisma.refreshToken.count({
      where: { userId: target.id, revokedAt: null },
    });
    expect(activeTokens).toBe(0); // đã thu hồi

    // Audit log có bản ghi user.block.
    const audit = await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs?entity=User&action=user.block')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .expect(200);
    expect(
      audit.body.items.some((l: { entityId: string }) => l.entityId === target.id),
    ).toBe(true);
  });

  function tokenFor(user: User): string {
    return jwtService.sign({ sub: user.id, role: user.role, tier: user.tier });
  }

  async function createUser(email: string, role: UserRole): Promise<User> {
    return prisma.user.upsert({
      where: { email },
      update: { role },
      create: { email, fullName: email, role },
    });
  }

  async function cleanup() {
    const users = await prisma.user.findMany({
      where: { email: { in: EMAILS } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length > 0) {
      await prisma.auditLog.deleteMany({ where: { entityId: { in: ids } } });
      await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  }
});
