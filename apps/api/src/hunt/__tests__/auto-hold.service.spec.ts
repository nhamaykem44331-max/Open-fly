import { ConflictException } from '@nestjs/common';
import { Hunt, HuntStatus } from '@prisma/client';
import { BookingService } from '../../booking/booking.service';
import { NotifierService } from '../../notifier/notifier.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AutoHoldService } from '../auto-hold.service';

function baseHunt(overrides: Partial<Hunt> = {}): Hunt {
  return {
    id: 'h1',
    userId: 'u1',
    status: HuntStatus.HUNTING,
    fromCode: 'HAN',
    toCode: 'SGN',
    channels: ['telegram'],
    autoHoldEnabled: true,
    autoHoldsUsed: 0,
    autoHoldMaxHolds: 1,
    autoHoldPassengers: [
      { title: 'MR', firstName: 'KIEN', lastName: 'NGUYEN QUANG', type: 'ADT' },
    ],
    autoHoldContactPhone: '+84903271845',
    autoHoldContactEmail: 'kien@example.com',
    ...overrides,
  } as unknown as Hunt;
}

const OFFER = { offerId: 'off1', fareClass: 'E' };

describe('AutoHoldService', () => {
  let prisma: {
    hunt: { update: jest.Mock; findMany: jest.Mock };
    booking: { count: jest.Mock };
    user: { findUnique: jest.Mock };
    auditLog: { create: jest.Mock };
  };
  let booking: { hold: jest.Mock };
  let notifier: { enqueue: jest.Mock };
  let service: AutoHoldService;

  beforeEach(() => {
    prisma = {
      hunt: {
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      booking: { count: jest.fn().mockResolvedValue(0) },
      user: { findUnique: jest.fn().mockResolvedValue({ tier: 'STANDARD' }) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    booking = {
      hold: jest.fn().mockResolvedValue({
        id: 'b1',
        orderCode: 'OFY1',
        totalSellPrice: 1_490_000,
        paymentDeadline: new Date('2026-06-10T09:00:00Z'),
      }),
    };
    notifier = { enqueue: jest.fn().mockResolvedValue('n1') };
    service = new AutoHoldService(
      prisma as unknown as PrismaService,
      booking as unknown as BookingService,
      notifier as unknown as NotifierService,
    );
  });

  it('auto-hold tắt -> không giữ', async () => {
    const result = await service.execute(
      baseHunt({ autoHoldEnabled: false }),
      OFFER,
    );
    expect(result).toEqual({ held: false, reason: 'disabled' });
    expect(booking.hold).not.toHaveBeenCalled();
  });

  it('đã dùng hết quota hold của hunt -> không giữ', async () => {
    const result = await service.execute(
      baseHunt({ autoHoldsUsed: 1, autoHoldMaxHolds: 1 }),
      OFFER,
    );
    expect(result).toEqual({ held: false, reason: 'max_holds' });
    expect(booking.hold).not.toHaveBeenCalled();
  });

  it('thiếu hành khách người lớn -> không giữ', async () => {
    const result = await service.execute(
      baseHunt({
        autoHoldPassengers: [
          { title: 'MSTR', firstName: 'BE', lastName: 'NGUYEN', type: 'CHD' },
        ] as never,
      }),
      OFFER,
    );
    expect(result).toEqual({ held: false, reason: 'incomplete' });
  });

  it('chạm giới hạn auto-hold đồng thời theo tier -> không giữ', async () => {
    prisma.hunt.findMany.mockResolvedValue([{ lastAutoHeldBookingId: 'b0' }]);
    prisma.booking.count.mockResolvedValue(1); // STANDARD concurrency = 1

    const result = await service.execute(baseHunt(), OFFER);

    expect(result).toEqual({ held: false, reason: 'concurrency' });
    expect(booking.hold).not.toHaveBeenCalled();
  });

  it('giữ chỗ thành công -> hunt PAUSE + tăng autoHoldsUsed + thông báo', async () => {
    const result = await service.execute(baseHunt(), OFFER);

    expect(result).toEqual({ held: true, bookingId: 'b1' });
    expect(booking.hold).toHaveBeenCalledWith(
      expect.objectContaining({ offerId: 'off1', fareClass: 'E' }),
      { userId: 'u1' },
    );
    expect(prisma.hunt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: HuntStatus.PAUSED,
          autoHoldsUsed: { increment: 1 },
          lastAutoHeldBookingId: 'b1',
        }),
      }),
    );
    expect(notifier.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'HUNT_FOUND', bookingId: 'b1' }),
    );
  });

  it('hold bị từ chối (giá đổi/hết chỗ) -> held:false, không pause hunt', async () => {
    booking.hold.mockRejectedValue(new ConflictException('Hết chỗ'));

    const result = await service.execute(baseHunt(), OFFER);

    expect(result).toEqual({ held: false, reason: 'hold_rejected' });
    expect(prisma.hunt.update).not.toHaveBeenCalled();
  });
});
