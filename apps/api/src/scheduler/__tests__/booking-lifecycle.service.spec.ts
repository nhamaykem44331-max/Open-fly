import { BookingStatus, PaymentIntentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingLifecycleService } from '../booking-lifecycle.service';

describe('BookingLifecycleService', () => {
  const now = new Date('2026-06-11T10:00:00.000Z');
  let prisma: {
    paymentIntent: {
      findMany: jest.Mock;
    };
    booking: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let tx: {
    paymentIntent: {
      updateMany: jest.Mock;
      count: jest.Mock;
    };
    booking: {
      updateMany: jest.Mock;
    };
    bookingTimelineEvent: {
      create: jest.Mock;
    };
  };
  let service: BookingLifecycleService;

  beforeEach(() => {
    tx = {
      paymentIntent: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
      booking: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      bookingTimelineEvent: {
        create: jest.fn().mockResolvedValue({ id: 'timeline-id' }),
      },
    };
    prisma = {
      paymentIntent: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    service = new BookingLifecycleService(prisma as unknown as PrismaService);
  });

  it('expires pending intents and reverts booking to HELD when no pending intent remains', async () => {
    prisma.paymentIntent.findMany.mockResolvedValue([
      {
        id: 'intent-id',
        bookingId: 'booking-id',
        providerOrderCode: '1760000000001',
      },
    ]);

    await expect(service.expireIntents(now)).resolves.toBe(1);

    expect(prisma.paymentIntent.findMany).toHaveBeenCalledWith({
      where: {
        status: PaymentIntentStatus.PENDING,
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        bookingId: true,
        providerOrderCode: true,
      },
    });
    expect(tx.paymentIntent.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'intent-id',
        status: PaymentIntentStatus.PENDING,
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: PaymentIntentStatus.EXPIRED,
      },
    });
    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'booking-id',
        status: BookingStatus.PAYMENT_PENDING,
      },
      data: {
        status: BookingStatus.HELD,
      },
    });
    expect(tx.bookingTimelineEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: 'booking-id',
          eventType: 'PAYMENT_INTENT_EXPIRED',
        }),
      }),
    );
  });

  it('does nothing when no intent is expired', async () => {
    await expect(service.expireIntents(now)).resolves.toBe(0);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('expires overdue bookings and pending intents idempotently', async () => {
    prisma.booking.findMany.mockResolvedValue([{ id: 'booking-id' }]);

    await expect(service.expireBookings(now)).resolves.toBe(1);

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: {
        status: {
          in: [BookingStatus.HELD, BookingStatus.PAYMENT_PENDING],
        },
        paymentDeadline: {
          lt: now,
        },
      },
      select: {
        id: true,
      },
    });
    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'booking-id',
        status: {
          in: [BookingStatus.HELD, BookingStatus.PAYMENT_PENDING],
        },
        paymentDeadline: {
          lt: now,
        },
      },
      data: {
        status: BookingStatus.EXPIRED,
      },
    });
    expect(tx.paymentIntent.updateMany).toHaveBeenCalledWith({
      where: {
        bookingId: 'booking-id',
        status: PaymentIntentStatus.PENDING,
      },
      data: {
        status: PaymentIntentStatus.EXPIRED,
      },
    });
    expect(tx.bookingTimelineEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: 'booking-id',
          eventType: 'EXPIRED',
        }),
      }),
    );
  });

  it('does nothing when no booking is overdue', async () => {
    await expect(service.expireBookings(now)).resolves.toBe(0);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
