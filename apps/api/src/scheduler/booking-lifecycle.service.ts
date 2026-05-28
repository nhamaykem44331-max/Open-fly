import { Injectable } from '@nestjs/common';
import { BookingStatus, PaymentIntentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async expireIntents(now = new Date()): Promise<number> {
    const intents = await this.prisma.paymentIntent.findMany({
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

    let expired = 0;
    for (const intent of intents) {
      expired += await this.prisma.$transaction(async (tx) => {
        const updated = await tx.paymentIntent.updateMany({
          where: {
            id: intent.id,
            status: PaymentIntentStatus.PENDING,
            expiresAt: {
              lt: now,
            },
          },
          data: {
            status: PaymentIntentStatus.EXPIRED,
          },
        });
        if (updated.count === 0) {
          return 0;
        }

        const pendingIntentCount = await tx.paymentIntent.count({
          where: {
            bookingId: intent.bookingId,
            status: PaymentIntentStatus.PENDING,
          },
        });
        if (pendingIntentCount === 0) {
          const bookingUpdated = await tx.booking.updateMany({
            where: {
              id: intent.bookingId,
              status: BookingStatus.PAYMENT_PENDING,
            },
            data: {
              status: BookingStatus.HELD,
            },
          });
          if (bookingUpdated.count > 0) {
            await tx.bookingTimelineEvent.create({
              data: {
                bookingId: intent.bookingId,
                eventType: 'PAYMENT_INTENT_EXPIRED',
                title: 'QR thanh toán đã hết hạn',
                payload: {
                  paymentIntentId: intent.id,
                  providerOrderCode: intent.providerOrderCode,
                },
                occurredAt: now,
              },
            });
          }
        }

        return 1;
      });
    }

    return expired;
  }

  async expireBookings(now = new Date()): Promise<number> {
    const bookings = await this.prisma.booking.findMany({
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

    let expired = 0;
    for (const booking of bookings) {
      expired += await this.prisma.$transaction(async (tx) => {
        const updated = await tx.booking.updateMany({
          where: {
            id: booking.id,
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
        if (updated.count === 0) {
          return 0;
        }

        await tx.paymentIntent.updateMany({
          where: {
            bookingId: booking.id,
            status: PaymentIntentStatus.PENDING,
          },
          data: {
            status: PaymentIntentStatus.EXPIRED,
          },
        });
        await tx.bookingTimelineEvent.create({
          data: {
            bookingId: booking.id,
            eventType: 'EXPIRED',
            title: 'Booking đã hết hạn thanh toán',
            payload: {
              reason: 'PAYMENT_DEADLINE_EXPIRED',
            },
            occurredAt: now,
          },
        });

        // Phase 1 không gọi Muadi cancel-booking: PNR hold tự lapse, chưa xuất vé nên không phát sinh tiền.
        return 1;
      });
    }

    return expired;
  }
}
