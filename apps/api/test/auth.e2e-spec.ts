import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { GOOGLE_AUTH_PROVIDER } from './../src/integrations/google/google-auth-provider.interface';
import { PrismaService } from './../src/prisma/prisma.service';

const GOOGLE_ID = 'task-8-google-sub';
const GOOGLE_EMAIL = 'task8.user@example.com';

describe('JwtStrategy active/blocked enforcement (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GOOGLE_AUTH_PROVIDER)
      .useValue({
        verifyIdToken: async (idToken: string) => {
          if (idToken !== 'mock-valid-token') {
            throw new Error('Google token không hợp lệ');
          }

          return {
            sub: GOOGLE_ID,
            email: GOOGLE_EMAIL,
            email_verified: true,
            name: 'Task 8 User',
            picture: 'https://example.com/task-8-user.png',
            aud: process.env.GOOGLE_CLIENT_ID,
            iss: 'https://accounts.google.com',
          };
        },
      })
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
    await cleanupGoogleUser();
  });

  beforeEach(async () => {
    await cleanupGoogleUser();
  });

  afterAll(async () => {
    await cleanupGoogleUser();
    await app.close();
  });

  it('allows /me after Google login', async () => {
    const login = await loginGoogle();

    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${login.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(login.user.id);
        expect(body.googleEmail).toBe(GOOGLE_EMAIL);
      });
  });

  it('rejects an old token when user is inactive', async () => {
    const login = await loginGoogle();
    await prisma.user.update({
      where: { id: login.user.id },
      data: { active: false },
    });

    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${login.accessToken}`)
      .expect(403)
      .expect(({ body }) => {
        expect(body.message).toBe('Tài khoản đã bị vô hiệu hóa');
      });
  });

  it('rejects an old token when user is blocked', async () => {
    const login = await loginGoogle();
    await prisma.user.update({
      where: { id: login.user.id },
      data: {
        blocked: true,
        blockReason: 'Spam abuse',
      },
    });

    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${login.accessToken}`)
      .expect(403)
      .expect(({ body }) => {
        expect(body.message).toContain('Spam abuse');
      });
  });

  it('keeps 401 behavior when user no longer exists', async () => {
    const login = await loginGoogle();
    await prisma.user.delete({
      where: { id: login.user.id },
    });

    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${login.accessToken}`)
      .expect(401);
  });

  it('keeps 401 behavior for expired JWT', async () => {
    const login = await loginGoogle();
    const expiredToken = jwtService.sign(
      {
        sub: login.user.id,
        phone: login.user.phone,
        role: login.user.role,
        tier: login.user.tier,
      },
      { expiresIn: '-1s' },
    );

    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  async function loginGoogle() {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/google')
      .send({ idToken: 'mock-valid-token' })
      .expect(200);

    return response.body;
  }

  async function cleanupGoogleUser() {
    await prisma?.refreshToken.deleteMany({
      where: {
        user: {
          googleId: GOOGLE_ID,
        },
      },
    });
    await prisma?.user.deleteMany({
      where: {
        googleId: GOOGLE_ID,
      },
    });
  }
});
