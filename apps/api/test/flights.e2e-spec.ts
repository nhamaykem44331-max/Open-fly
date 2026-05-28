import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Flights search (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
    process.env.MUADI_USE_MOCK = 'true';

    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('searches flights with mock Muadi provider without JWT', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/flights/search')
      .send(validSearchBody())
      .expect(200)
      .expect(({ body }) => {
        expect(body.cached).toBe(false);
        expect(body.offers.length).toBeGreaterThan(0);
        expect(body.airlinesQueried).toEqual(['VN', 'VJ', 'QH', 'BL']);
        expect(body.offers[0].fareClasses.length).toBeGreaterThan(0);
        expect(body.offers[0].cheapestPriceVnd).toBeGreaterThan(0);
      });
  });

  it('rejects invalid origin code', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/flights/search')
      .send({
        ...validSearchBody(),
        origin: 'X',
      })
      .expect(400);
  });

  it('rejects same origin and destination', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/flights/search')
      .send({
        ...validSearchBody(),
        destination: 'SGN',
      })
      .expect(400);
  });

  it('rejects past departure date', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/flights/search')
      .send({
        ...validSearchBody(),
        date: '2020-01-01',
      })
      .expect(400);
  });

  it('throttles the 31st search request per minute', async () => {
    for (let index = 0; index < 30; index += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/flights/search')
        .send(validSearchBody())
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/v1/flights/search')
      .send(validSearchBody())
      .expect(429);
  });
});

async function createApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('/api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  return app;
}

function validSearchBody() {
  return {
    origin: 'SGN',
    destination: 'HAN',
    date: futureDate(),
    paxAdt: 1,
    paxChd: 0,
    paxInf: 0,
  };
}

function futureDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 30);

  return date.toISOString().slice(0, 10);
}
