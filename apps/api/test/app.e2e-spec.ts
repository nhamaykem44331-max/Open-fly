import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('OpenFly API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';

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
    await cleanupGoogleUser();
  });

  afterAll(async () => {
    await cleanupGoogleUser();
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.checks.db).toBe('ok');
      });
  });

  describe('/api/v1/auth/google (POST)', () => {
    it('signs in with a valid mock Google token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/google')
        .send({ idToken: 'mock-valid-token' })
        .expect(200);

      expect(response.body.accessToken).toEqual(expect.stringMatching(/^eyJ/));
      expect(response.body.refreshToken).toEqual(expect.stringMatching(/^[^.]+\..{64,}$/));
      expect(response.body.user.googleEmail).toBe('mock.user@example.com');
      expect(response.body.user.role).toBe('CUSTOMER');
      expect(response.body.user.tier).toBe('STANDARD');
    });

    it('upserts the same user on repeated Google sign-in', async () => {
      const first = await request(app.getHttpServer())
        .post('/api/v1/auth/google')
        .send({ idToken: 'mock-valid-token' })
        .expect(200);

      const second = await request(app.getHttpServer())
        .post('/api/v1/auth/google')
        .send({ idToken: 'mock-valid-token' })
        .expect(200);

      expect(second.body.user.id).toBe(first.body.user.id);
    });

    it('rejects an invalid Google token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/google')
        .send({ idToken: 'invalid' })
        .expect(401)
        .expect(({ body }) => {
          expect(body.message).toBe('Google token không hợp lệ');
        });
    });

    it('allows /me with an access token from Google sign-in', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/google')
        .send({ idToken: 'mock-valid-token' })
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(login.body.user.id);
          expect(body.googleEmail).toBe('mock.user@example.com');
        });
    });
  });

  describe.skip('Phone OTP routes disabled per Task 6', () => {
    it.skip('/api/v1/auth/otp/request (POST)', () => undefined);
    it.skip('/api/v1/auth/otp/verify (POST)', () => undefined);
    it.skip('/api/v1/auth/otp/voice (POST)', () => undefined);
  });

  async function cleanupGoogleUser() {
    await prisma?.refreshToken.deleteMany({
      where: {
        user: {
          googleId: 'mock-google-sub-001',
        },
      },
    });
    await prisma?.user.deleteMany({
      where: {
        googleId: 'mock-google-sub-001',
      },
    });
  }
});
