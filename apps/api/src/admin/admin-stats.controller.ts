import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  BookingStatus,
  HuntStatus,
  PaymentStatus,
  RefundStatus,
  UserRole,
} from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

// Read-only operational snapshot for the admin dashboard (Tổng quan). No money
// is moved here — only counts + a revenue sum for display. RBAC ADMIN.
@Controller('admin/stats')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async stats() {
    const now = new Date();
    const startOfVnDay = startOfVietnamDay(now);
    const urgentThreshold = new Date(now.getTime() + 30 * 60 * 1000);

    const [
      pendingTickets,
      pendingTicketsUrgent,
      issueFailed,
      bookingsToday,
      revenueAgg,
      huntsRunning,
      sessionTotal,
      sessionHealthy,
      paymentsReview,
      refundsOpen,
      soonRows,
    ] = await Promise.all([
      this.prisma.booking.count({ where: { status: BookingStatus.PAID } }),
      this.prisma.booking.count({
        where: { status: BookingStatus.PAID, muadiHoldExpiresAt: { lte: urgentThreshold } },
      }),
      this.prisma.booking.count({ where: { status: BookingStatus.ISSUE_FAILED } }),
      this.prisma.booking.count({ where: { createdAt: { gte: startOfVnDay } } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.PAID, paidAt: { gte: startOfVnDay } },
      }),
      this.prisma.hunt.count({
        where: { status: { in: [HuntStatus.HUNTING, HuntStatus.FOUND] } },
      }),
      this.prisma.muadiSession.count(),
      this.prisma.muadiSession.count({ where: { active: true, failureCount: { lt: 3 } } }),
      this.prisma.bankTransaction.count({ where: { status: 'MANUAL_REVIEW' } }),
      this.prisma.refundRequest.count({
        where: { status: { notIn: [RefundStatus.COMPLETED, RefundStatus.REJECTED] } },
      }),
      this.prisma.booking.findMany({
        where: { status: BookingStatus.PAID },
        orderBy: [{ muadiHoldExpiresAt: 'asc' }, { createdAt: 'asc' }],
        take: 5,
        select: {
          id: true,
          orderCode: true,
          fromCode: true,
          toCode: true,
          airline: true,
          departTime: true,
          muadiHoldExpiresAt: true,
          pnrs: { select: { pnr: true } },
        },
      }),
    ]);

    return {
      pendingTickets,
      pendingTicketsUrgent,
      issueFailed,
      bookingsToday,
      revenueToday: revenueAgg._sum.amount ?? 0,
      huntsRunning,
      sessionHealthy,
      sessionTotal,
      paymentsReview,
      refundsOpen,
      soonExpiring: soonRows.map((b) => ({
        id: b.id,
        orderCode: b.orderCode,
        route: `${b.fromCode}-${b.toCode}`,
        airline: b.airline,
        pnr: b.pnrs.map((p) => p.pnr),
        departTime: b.departTime,
        holdExpiresAt: b.muadiHoldExpiresAt,
      })),
    };
  }
}

// Start of "today" in Vietnam (UTC+7), expressed as a UTC instant — booking
// timestamps are stored UTC.
function startOfVietnamDay(now: Date): Date {
  const vn = new Date(now.getTime() + 7 * 3600 * 1000);
  const vnMidnightAsUtc = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate());
  return new Date(vnMidnightAsUtc - 7 * 3600 * 1000);
}
