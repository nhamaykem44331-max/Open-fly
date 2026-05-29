import { ConfigService } from '@nestjs/config';
import { Hunt, HuntStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { FlightsService } from '../../flights/flights.service';
import { MuadiSessionPoolService } from '../../integrations/muadi/muadi-session-pool.service';
import { NotifierService } from '../../notifier/notifier.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AutoHoldService } from '../auto-hold.service';
import { HunterRunService, resolveDays } from '../hunter-run.service';

function huntFx(overrides: Partial<Hunt> = {}): Hunt {
  return {
    id: 'h1',
    userId: 'u1',
    status: HuntStatus.HUNTING,
    fromCode: 'HAN',
    toCode: 'SGN',
    flexibility: 'EXACT_DATE',
    windowStart: new Date('2026-06-10T00:00:00Z'),
    windowEnd: new Date('2026-06-10T00:00:00Z'),
    targetPrice: 1_500_000,
    bestPriceFound: null,
    pax: 1,
    cabin: 'economy',
    airlines: [],
    channels: ['telegram'],
    intervalMinutes: 120,
    failureStreak: 0,
    emptyStreak: 0,
    autoHoldEnabled: false,
    ...overrides,
  } as unknown as Hunt;
}

function offerFx(price: number, seat = 5, flightNumber = 'VJ168') {
  return {
    id: 'off1',
    airline: { code: 'VJ', name: 'VietJet' },
    flightNumber,
    segments: [
      {
        from: { code: 'HAN' },
        to: { code: 'SGN' },
        departTime: '2026-06-10T08:00:00',
        arriveTime: '2026-06-10T10:00:00',
        durationMinutes: 120,
        flightNumber,
      },
    ],
    fareClasses: [
      {
        code: 'E',
        name: 'Eco',
        baseFareVnd: price - 200_000,
        taxesFeesVnd: 200_000,
        priceVnd: price,
        seatAvailable: seat,
        soldOut: seat <= 0,
      },
    ],
    cheapestPriceVnd: price,
    durationMinutes: 120,
    isDirect: true,
  };
}

describe('resolveDays', () => {
  it('EXACT_DATE -> đúng 1 ngày', () => {
    expect(resolveDays(huntFx(), 31)).toEqual(['2026-06-10']);
  });

  it('DATE_RANGE -> bị cắt theo maxDays', () => {
    const days = resolveDays(
      huntFx({
        flexibility: 'DATE_RANGE',
        windowStart: new Date('2026-06-10T00:00:00Z'),
        windowEnd: new Date('2026-06-30T00:00:00Z'),
      }),
      5,
    );
    expect(days).toHaveLength(5);
    expect(days[0]).toBe('2026-06-10');
  });
});

describe('HunterRunService.run', () => {
  let prisma: any;
  let flights: { search: jest.Mock };
  let pool: { acquireForHunter: jest.Mock; release: jest.Mock };
  let autoHold: { execute: jest.Mock };
  let notifier: { enqueue: jest.Mock };
  let queue: { add: jest.Mock };
  let service: HunterRunService;

  beforeEach(() => {
    prisma = {
      hunt: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      huntRun: {
        create: jest.fn().mockResolvedValue({ id: 'r1' }),
        findFirst: jest.fn().mockResolvedValue(null), // chưa có lần quét trước
        update: jest.fn().mockResolvedValue({}),
      },
      routePriceObservation: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        aggregate: jest.fn().mockResolvedValue({ _min: { sellPriceVnd: null } }),
      },
    };
    flights = { search: jest.fn() };
    pool = {
      acquireForHunter: jest.fn().mockResolvedValue({ id: 's1' }),
      release: jest.fn().mockResolvedValue(undefined),
    };
    autoHold = { execute: jest.fn() };
    notifier = { enqueue: jest.fn().mockResolvedValue('n1') };
    queue = { add: jest.fn().mockResolvedValue({}) };
    service = new HunterRunService(
      prisma as unknown as PrismaService,
      flights as unknown as FlightsService,
      pool as unknown as MuadiSessionPoolService,
      autoHold as unknown as AutoHoldService,
      notifier as unknown as NotifierService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      queue as unknown as Queue,
    );
  });

  it('hunt không HUNTING -> bỏ qua, không acquire session', async () => {
    prisma.hunt.findUnique.mockResolvedValue(
      huntFx({ status: HuntStatus.PAUSED }),
    );
    await service.run('h1');
    expect(pool.acquireForHunter).not.toHaveBeenCalled();
  });

  it('hết headroom session -> requeue backoff, không tạo HuntRun', async () => {
    prisma.hunt.findUnique.mockResolvedValue(huntFx());
    pool.acquireForHunter.mockResolvedValue(null);

    await service.run('h1');

    expect(prisma.huntRun.create).not.toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith(
      'scan',
      { huntId: 'h1' },
      expect.objectContaining({ delay: 2 * 60_000 }),
    );
  });

  it('quét đầu giá trên target -> ghi HuntRun + observations + reschedule, không notify', async () => {
    prisma.hunt.findUnique.mockResolvedValue(huntFx({ targetPrice: 1_000_000 }));
    flights.search.mockResolvedValue({ offers: [offerFx(1_800_000)] });

    await service.run('h1');

    expect(prisma.huntRun.create).toHaveBeenCalled();
    expect(prisma.routePriceObservation.createMany).toHaveBeenCalled();
    expect(notifier.enqueue).not.toHaveBeenCalled(); // scan đầu, không progress
    expect(queue.add).toHaveBeenCalledWith(
      'scan',
      { huntId: 'h1' },
      expect.objectContaining({ delay: 120 * 60_000 }),
    );
    expect(pool.release).toHaveBeenCalledWith('s1', true);
  });

  it('chạm target + auto-hold giữ được -> execute auto-hold, KHÔNG reschedule', async () => {
    prisma.hunt.findUnique.mockResolvedValue(
      huntFx({ autoHoldEnabled: true, targetPrice: 2_000_000 }),
    );
    flights.search.mockResolvedValue({ offers: [offerFx(1_490_000)] });
    autoHold.execute.mockResolvedValue({ held: true, bookingId: 'b1' });

    await service.run('h1');

    expect(autoHold.execute).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ offerId: 'off1', fareClass: 'E' }),
    );
    expect(notifier.enqueue).not.toHaveBeenCalled(); // auto-hold tự notify
    expect(queue.add).not.toHaveBeenCalled(); // đã PAUSE
  });

  it('chạm target không auto-hold -> notify HUNT_FOUND + FOUND, không reschedule', async () => {
    prisma.hunt.findUnique.mockResolvedValue(huntFx({ targetPrice: 2_000_000 }));
    flights.search.mockResolvedValue({ offers: [offerFx(1_490_000)] });

    await service.run('h1');

    expect(notifier.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'HUNT_FOUND' }),
    );
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('scan lỗi dưới ngưỡng -> tăng failureStreak + reschedule', async () => {
    prisma.hunt.findUnique.mockResolvedValue(huntFx({ failureStreak: 0 }));
    flights.search.mockRejectedValue(new Error('Muadi down'));

    await service.run('h1');

    expect(prisma.huntRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ error: expect.stringContaining('Muadi') }),
      }),
    );
    expect(prisma.hunt.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failureStreak: 1 }) }),
    );
    expect(queue.add).toHaveBeenCalled();
    expect(pool.release).toHaveBeenCalledWith('s1', false);
  });

  it('scan lỗi đạt ngưỡng 5 -> PAUSE + thông báo, không reschedule', async () => {
    prisma.hunt.findUnique.mockResolvedValue(huntFx({ failureStreak: 4 }));
    flights.search.mockRejectedValue(new Error('Muadi down'));

    await service.run('h1');

    expect(prisma.hunt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: HuntStatus.PAUSED,
          autoDisabledReason: expect.stringContaining('5'),
        }),
      }),
    );
    expect(notifier.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'SYSTEM' }),
    );
    expect(queue.add).not.toHaveBeenCalled();
  });
});
