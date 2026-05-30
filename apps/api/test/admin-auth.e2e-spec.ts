import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MUADI_PROVIDER } from './../src/integrations/muadi/muadi-provider.interface';
import { PrismaService } from './../src/prisma/prisma.service';

const PASSWORD = 'Admin@12345';
const ADMIN_EMAIL = 'admin-auth-adm@example.com';
const CUST_EMAIL = 'admin-auth-cust@example.com';
const BLOCKED_EMAIL = 'admin-auth-blocked@example.com';
const EMAILS = [ADMIN_EMAIL, CUST_EMAIL, BLOCKED_EMAIL];

// Route POST /auth/admin/login bị throttle 5 lần/phút/IP. ThrottlerModule lưu
// in-memory (không Redis) → đếm reset mỗi lần chạy test. Vì vậy ta chỉ gọi đúng
// 5 login "hành vi" + dùng JwtService tự mint token cho các read RBAC/audit (để
// không tiêu quota login), rồi 1 login thứ 6 để khẳng định throttle trả 429.
describe('Admin auth — password login (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

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
    jwt = app.get(JwtService);
    await cleanup();
    await seed();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const login = (email: string, password: string) =>
    request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({ email, password });

  const adminToken = (u: User) =>
    jwt.sign({ sub: u.id, role: u.role, tier: u.tier });

  // login #1
  it('logs in an ADMIN and issues a token that passes the ADMIN RBAC guard', async () => {
    const res = await login(ADMIN_EMAIL, PASSWORD).expect(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.role).toBe(UserRole.ADMIN);
    expect(res.body.user.passwordHash).toBeUndefined(); // không lộ hash

    await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);
  });

  // không tốn quota login — mint token trực tiếp
  it('writes an admin.login audit log entry', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } });
    const audit = await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs?entity=User&action=admin.login')
      .set('Authorization', `Bearer ${adminToken(admin)}`)
      .expect(200);
    expect(
      audit.body.items.some((l: { entityId: string }) => l.entityId === admin.id),
    ).toBe(true);
  });

  // login #2
  it('rejects a wrong password with a generic 401', async () => {
    const res = await login(ADMIN_EMAIL, 'wrong-password').expect(401);
    expect(res.body.message).toBe('Email hoặc mật khẩu không đúng');
  });

  // login #3
  it('rejects a non-ADMIN account even with the correct password (no enumeration)', async () => {
    const res = await login(CUST_EMAIL, PASSWORD).expect(401);
    expect(res.body.message).toBe('Email hoặc mật khẩu không đúng');
  });

  // login #4
  it('rejects an unknown email with a generic 401', async () => {
    await login('nobody@example.com', PASSWORD).expect(401);
  });

  // login #5
  it('rejects a blocked admin (403) only after the password matches', async () => {
    const res = await login(BLOCKED_EMAIL, PASSWORD).expect(403);
    expect(res.body.message).toBe('Tài khoản quản trị đã bị vô hiệu hóa');
  });

  // login #6 — vượt giới hạn 5/phút
  it('throttles repeated login attempts (429)', async () => {
    await login(ADMIN_EMAIL, 'whatever').expect(429);
  });

  async function seed() {
    const passwordHash = await bcrypt.hash(PASSWORD, 4); // rounds thấp cho test nhanh
    await prisma.user.create({
      data: { email: ADMIN_EMAIL, fullName: 'Admin Auth', role: UserRole.ADMIN, passwordHash },
    });
    await prisma.user.create({
      data: { email: CUST_EMAIL, fullName: 'Cust Auth', role: UserRole.CUSTOMER, passwordHash },
    });
    await prisma.user.create({
      data: {
        email: BLOCKED_EMAIL,
        fullName: 'Blocked Admin',
        role: UserRole.ADMIN,
        passwordHash,
        blocked: true,
        blockReason: 'test',
      },
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
