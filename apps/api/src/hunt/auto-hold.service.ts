import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { BookingStatus, Hunt, HuntStatus, MembershipTier, Prisma } from '@prisma/client';
import { BookingService } from '../booking/booking.service';
import { NotifierService } from '../notifier/notifier.service';
import { PrismaService } from '../prisma/prisma.service';
import { autoHoldConcurrency } from './tier-limits';

export interface AutoHoldOffer {
  offerId: string;
  fareClass: string;
}

export type AutoHoldResult =
  | { held: true; bookingId: string }
  | { held: false; reason: string };

interface StoredPassenger {
  title: string;
  firstName: string;
  lastName: string;
  dob?: string;
  type: 'ADT' | 'CHD' | 'INF';
}

/**
 * Tự giữ chỗ (vũ khí #1) khi hunt chạm giá mục tiêu. Tái dùng BookingService.hold
 * (luồng Sprint 2: reconcile giá + paymentDeadline guard). Giữ thành công ->
 * hunt PAUSE + thông báo khẩn kèm hạn thanh toán. KHÔNG ném lỗi ra ngoài để
 * không làm hỏng vòng quét của Hunter (T5).
 */
@Injectable()
export class AutoHoldService {
  private readonly logger = new Logger(AutoHoldService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingService: BookingService,
    private readonly notifier: NotifierService,
  ) {}

  async execute(hunt: Hunt, offer: AutoHoldOffer): Promise<AutoHoldResult> {
    if (!hunt.autoHoldEnabled) {
      return { held: false, reason: 'disabled' };
    }
    if (hunt.autoHoldsUsed >= hunt.autoHoldMaxHolds) {
      return { held: false, reason: 'max_holds' };
    }

    const passengers = parsePassengers(hunt.autoHoldPassengers);
    if (
      !passengers ||
      !passengers.some((p) => p.type === 'ADT') ||
      !hunt.autoHoldContactPhone ||
      !hunt.autoHoldContactEmail
    ) {
      return { held: false, reason: 'incomplete' };
    }

    const tier = await this.userTier(hunt.userId);
    if (await this.reachedConcurrency(hunt.userId, tier)) {
      return { held: false, reason: 'concurrency' };
    }

    let booking;
    try {
      booking = await this.bookingService.hold(
        {
          offerId: offer.offerId,
          fareClass: offer.fareClass,
          passengers,
          contact: {
            phone: hunt.autoHoldContactPhone,
            email: hunt.autoHoldContactEmail,
          },
        } as never,
        { userId: hunt.userId },
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        // Giá đổi / hết chỗ / window quá ngắn — không giữ được, không phá hunt.
        return { held: false, reason: 'hold_rejected' };
      }
      this.logger.warn(
        `Auto-hold lỗi hunt ${hunt.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { held: false, reason: 'error' };
    }

    const held = booking as {
      id: string;
      orderCode: string;
      totalSellPrice: number;
      paymentDeadline: Date | null;
    };

    await this.prisma.hunt.update({
      where: { id: hunt.id },
      data: {
        status: HuntStatus.PAUSED,
        autoHoldsUsed: { increment: 1 },
        lastAutoHeldBookingId: held.id,
        bestPriceFound: held.totalSellPrice,
        bestPriceDate: new Date(),
      },
    });

    await this.notify(hunt, held);
    await this.audit(hunt, held);

    return { held: true, bookingId: held.id };
  }

  private async userTier(userId: string): Promise<MembershipTier> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true },
    });

    return user?.tier ?? MembershipTier.STANDARD;
  }

  private async reachedConcurrency(
    userId: string,
    tier: MembershipTier,
  ): Promise<boolean> {
    const heldHunts = await this.prisma.hunt.findMany({
      where: { userId, lastAutoHeldBookingId: { not: null } },
      select: { lastAutoHeldBookingId: true },
    });
    const ids = heldHunts
      .map((h) => h.lastAutoHeldBookingId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) {
      return false;
    }

    const active = await this.prisma.booking.count({
      where: { id: { in: ids }, status: BookingStatus.HELD },
    });

    return active >= autoHoldConcurrency(tier);
  }

  private notify(
    hunt: Hunt,
    booking: { id: string; orderCode: string; totalSellPrice: number; paymentDeadline: Date | null },
  ): Promise<string> {
    const deadline = booking.paymentDeadline
      ? booking.paymentDeadline.toLocaleString('vi-VN')
      : 'sớm';

    return this.notifier.enqueue({
      userId: hunt.userId,
      kind: 'HUNT_FOUND',
      title: 'OpenFly đã giữ chỗ cho bạn',
      body: `${hunt.fromCode}-${hunt.toCode} giá ${booking.totalSellPrice.toLocaleString('vi-VN')}đ. Thanh toán trước ${deadline} để giữ vé.`,
      huntId: hunt.id,
      bookingId: booking.id,
      ctaLabel: 'Thanh toán',
      payload: {
        orderCode: booking.orderCode,
        sellPrice: booking.totalSellPrice,
        paymentDeadline: booking.paymentDeadline?.toISOString() ?? null,
      },
      requestedChannels: hunt.channels,
    });
  }

  private audit(
    hunt: Hunt,
    booking: { id: string; totalSellPrice: number },
  ): Promise<unknown> {
    return this.prisma.auditLog
      .create({
        data: {
          actorId: hunt.userId,
          actorType: 'system',
          entity: 'Hunt',
          entityId: hunt.id,
          action: 'hunt.auto_hold',
          beforeJson: Prisma.JsonNull,
          afterJson: {
            bookingId: booking.id,
            sellPrice: booking.totalSellPrice,
          },
        },
      })
      .catch((error) => {
        this.logger.warn(
          `Ghi AuditLog auto-hold thất bại: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      });
  }
}

function parsePassengers(value: unknown): StoredPassenger[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value as StoredPassenger[];
}
