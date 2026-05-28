import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import {
  IMuadiProvider,
  MUADI_PROVIDER,
} from './../src/integrations/muadi/muadi-provider.interface';

describe('Flights search (e2e)', () => {
  let app: INestApplication;
  let provider: jest.Mocked<IMuadiProvider>;

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
    process.env.MUADI_USE_MOCK = 'true';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.FLIGHT_SEARCH_CACHE_TTL_SECONDS =
      process.env.FLIGHT_SEARCH_CACHE_TTL_SECONDS || '60';

    await flushRedis();
    provider = {
      search: jest.fn().mockResolvedValue(mockProviderResult()),
    };
    app = await createApp(provider);
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

  it('returns cached response on repeated same-key search', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/v1/flights/search')
      .send(validSearchBody())
      .expect(200);

    const second = await request(app.getHttpServer())
      .post('/api/v1/flights/search')
      .send(validSearchBody())
      .expect(200);

    expect(first.body.cached).toBe(false);
    expect(second.body.cached).toBe(true);
    expect(provider.search).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent same-key searches', async () => {
    let resolveSearch: (value: ReturnType<typeof mockProviderResult>) => void;
    provider.search.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );

    const responsesPromise = Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/flights/search')
        .send(validSearchBody()),
      request(app.getHttpServer())
        .post('/api/v1/flights/search')
        .send(validSearchBody()),
    ]);
    await waitForProviderCall(provider);
    resolveSearch!(mockProviderResult());
    const responses = await responsesPromise;

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(provider.search).toHaveBeenCalledTimes(1);
  });

  it('calls provider separately for different search keys', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/flights/search')
      .send(validSearchBody())
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/flights/search')
      .send({
        ...validSearchBody(),
        date: futureDate(31),
      })
      .expect(200);

    expect(provider.search).toHaveBeenCalledTimes(2);
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

async function createApp(provider: IMuadiProvider): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MUADI_PROVIDER)
    .useValue(provider)
    .compile();

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

async function flushRedis(): Promise<void> {
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    lazyConnect: true,
  });
  try {
    await redis.connect();
    await redis.flushdb();
  } finally {
    if (redis.status !== 'end') {
      await redis.quit();
    }
  }
}

async function waitForProviderCall(
  provider: jest.Mocked<IMuadiProvider>,
): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    if (provider.search.mock.calls.length > 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error('Provider search was not called');
}

function validSearchBody() {
  return {
    origin: 'SGN',
    destination: 'HAN',
    date: futureDate(30),
    paxAdt: 1,
    paxChd: 0,
    paxInf: 0,
  };
}

function futureDate(daysFromNow: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);

  return date.toISOString().slice(0, 10);
}

function mockProviderResult() {
  return {
    provider: 'mock' as const,
    searchedAt: '2026-05-28T10:00:00.000Z',
    airlinesQueried: ['VN', 'VJ', 'QH', 'BL'],
    airlinesFailed: [],
    rawFlights: [
      {
        airline: 'VN',
        routeInfo: [
          {
            carrierCode: 'VN',
            flightNumber: '247',
            from: 'SGN',
            to: 'HAN',
            departDate: toMuadiDateTime(futureDate(30), '08:00'),
            arrivalDate: toMuadiDateTime(futureDate(30), '10:10'),
            flightTimeHour: 2,
            flightTimeMinute: 10,
          },
        ],
        priceInfo: [
          {
            class: 'L',
            seatAvailable: 9,
            fareADT: 900000,
            taxADT: 240000,
            vatADT: 90000,
            issueFeeADT: 50000,
          },
        ],
      },
    ],
  };
}

function toMuadiDateTime(isoDate: string, time: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year} ${time}`;
}
