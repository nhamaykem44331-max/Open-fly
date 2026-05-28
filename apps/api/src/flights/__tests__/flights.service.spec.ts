import { ConfigService } from '@nestjs/config';
import { IMuadiProvider } from '../../integrations/muadi/muadi-provider.interface';
import { RedisService } from '../../integrations/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchResponseDto } from '../dto/search-response.dto';
import { FlightsService } from '../flights.service';

describe('FlightsService', () => {
  let provider: jest.Mocked<IMuadiProvider>;
  let redis: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'del'>>;
  let prisma: Pick<PrismaService, 'airport' | 'airline'>;
  let config: Pick<ConfigService, 'get'>;
  let service: FlightsService;

  beforeEach(() => {
    provider = {
      search: jest.fn().mockResolvedValue(mockProviderResult()),
      hold: jest.fn(),
    };
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      airport: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      airline: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as Pick<PrismaService, 'airport' | 'airline'>;
    config = {
      get: jest.fn().mockReturnValue('60'),
    };

    service = new FlightsService(
      provider,
      prisma as PrismaService,
      redis as unknown as RedisService,
      config as ConfigService,
    );
  });

  it('coalesces concurrent same-key searches', async () => {
    let resolveSearch: (value: ReturnType<typeof mockProviderResult>) => void;
    provider.search.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );

    const first = service.search(validSearchBody());
    const second = service.search(validSearchBody());
    resolveSearch!(mockProviderResult());

    const [firstResponse, secondResponse] = await Promise.all([first, second]);

    expect(provider.search).toHaveBeenCalledTimes(1);
    expect(firstResponse.offers).toHaveLength(1);
    expect(secondResponse.offers).toHaveLength(1);
  });

  it('short-circuits provider on cache hit', async () => {
    redis.get.mockResolvedValue(cachedResponse());

    const response = await service.search(validSearchBody());

    expect(response.cached).toBe(true);
    expect(provider.search).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('writes response to cache on miss', async () => {
    const response = await service.search(validSearchBody());

    expect(response.cached).toBe(false);
    expect(redis.set).toHaveBeenCalledWith(
      'flights:search:SGN:HAN:2026-06-15:1:0:0',
      expect.objectContaining({
        cached: false,
        offers: expect.any(Array),
      }),
      60,
    );
  });
});

function validSearchBody() {
  return {
    origin: 'SGN',
    destination: 'HAN',
    date: '2026-06-15',
    paxAdt: 1,
    paxChd: 0,
    paxInf: 0,
  };
}

function mockProviderResult() {
  return {
    provider: 'mock' as const,
    searchedAt: '2026-05-28T10:00:00.000Z',
    airlinesQueried: ['VN'],
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
            departDate: '15-06-2026 08:00',
            arrivalDate: '15-06-2026 10:10',
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

function cachedResponse(): SearchResponseDto {
  return {
    query: validSearchBody(),
    offers: [],
    airlinesQueried: ['VN'],
    airlinesFailed: [],
    cached: false,
    fetchedAt: '2026-05-28T10:00:00.000Z',
  };
}
