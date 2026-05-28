import { ConflictException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { RedisService } from '../../integrations/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingController } from '../booking.controller';
import { BookingService } from '../booking.service';
import { HoldBookingDto } from '../dto/hold-booking.dto';

describe('BookingController hold idempotency', () => {
  let bookingService: jest.Mocked<Pick<BookingService, 'hold'>>;
  let redis: jest.Mocked<Pick<RedisService, 'setNx' | 'get' | 'set' | 'del'>>;
  let controller: BookingController;

  beforeEach(() => {
    bookingService = {
      hold: jest.fn().mockResolvedValue(mockBooking()),
    };
    redis = {
      setNx: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    controller = new BookingController(
      bookingService as unknown as BookingService,
      {} as PrismaService,
      redis as unknown as RedisService,
    );
  });

  it('reserves key, stores done response, and returns booking', async () => {
    const response = await controller.hold(validDto(), user(), 'idem-1');

    expect(response.id).toBe('booking-id');
    expect(bookingService.hold).toHaveBeenCalledTimes(1);
    expect(redis.setNx).toHaveBeenCalledWith(
      'idempotency:booking-hold:user-id:idem-1',
      { status: 'processing' },
      300,
    );
    expect(redis.set).toHaveBeenCalledWith(
      'idempotency:booking-hold:user-id:idem-1',
      {
        status: 'done',
        response,
      },
      300,
    );
  });

  it('returns cached done response without calling hold again', async () => {
    const cached = {
      id: 'booking-id',
      orderCode: 'OFY123',
      pnr: 'PNR123',
      status: BookingStatus.HELD,
      paymentDeadline: new Date('2026-06-11T10:00:00.000Z'),
      totalSellPrice: 1500000,
    };
    redis.setNx.mockResolvedValue(false);
    redis.get.mockResolvedValue({
      status: 'done',
      response: cached,
    });

    await expect(
      controller.hold(validDto(), user(), 'idem-1'),
    ).resolves.toEqual(cached);
    expect(bookingService.hold).not.toHaveBeenCalled();
  });

  it('returns 409 when the same key is still processing', async () => {
    redis.setNx.mockResolvedValue(false);
    redis.get.mockResolvedValue({ status: 'processing' });

    await expect(controller.hold(validDto(), user(), 'idem-1')).rejects.toThrow(
      ConflictException,
    );
    expect(bookingService.hold).not.toHaveBeenCalled();
  });

  it('deletes reservation when hold fails so caller can retry', async () => {
    bookingService.hold.mockRejectedValue(new Error('Hết chỗ'));

    await expect(controller.hold(validDto(), user(), 'idem-1')).rejects.toThrow(
      ConflictException,
    );
    expect(redis.del).toHaveBeenCalledWith(
      'idempotency:booking-hold:user-id:idem-1',
    );
  });
});

function validDto(): HoldBookingDto {
  return {
    offerId: 'offer-id',
    fareClass: 'L',
    passengers: [
      {
        title: 'MR',
        firstName: 'Anh',
        lastName: 'Vu',
        type: 'ADT',
      },
    ],
    contact: {
      phone: '+84938121234',
      email: 'guest@example.com',
    },
  };
}

function user() {
  return {
    id: 'user-id',
  } as never;
}

function mockBooking() {
  return {
    id: 'booking-id',
    orderCode: 'OFY123',
    pnr: 'PNR123',
    status: BookingStatus.HELD,
    paymentDeadline: new Date('2026-06-11T10:00:00.000Z'),
    totalSellPrice: 1500000,
  };
}
