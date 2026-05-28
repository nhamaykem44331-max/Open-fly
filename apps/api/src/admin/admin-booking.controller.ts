import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingStatus, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserPublicDto } from '../common/dto/user-public.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

class TicketNumberDto {
  @IsString()
  pnr!: string;

  @IsString()
  ticketNumber!: string;
}

class MarkTicketedDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TicketNumberDto)
  ticketNumbers!: TicketNumberDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

class MarkIssueFailedDto {
  @IsString()
  reason!: string;
}

@Controller('admin/bookings')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBookingController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(':id/mark-ticketed')
  @HttpCode(200)
  async markTicketed(
    @Param('id') id: string,
    @Body() dto: MarkTicketedDto,
    @CurrentUser() admin: UserPublicDto,
    @Req() request: Request,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: {
          id,
        },
        include: {
          pnrs: true,
        },
      });
      if (!booking) {
        throw new BadRequestException('Booking không tồn tại');
      }
      if (booking.status !== BookingStatus.PAID) {
        throw new ConflictException('Booking chưa thanh toán hoặc đã xử lý');
      }

      const before = {
        status: booking.status,
        pnrs: booking.pnrs.map((pnr) => ({
          pnr: pnr.pnr,
          ticketNumber: pnr.ticketNumber,
        })),
      };
      const ticketByPnr = new Map(
        dto.ticketNumbers.map((item) => [
          item.pnr.trim().toUpperCase(),
          item.ticketNumber.trim(),
        ]),
      );

      for (const item of dto.ticketNumbers) {
        const pnr = booking.pnrs.find(
          (row) => row.pnr.toUpperCase() === item.pnr.trim().toUpperCase(),
        );
        if (!pnr) {
          throw new BadRequestException(`PNR ${item.pnr} không thuộc booking`);
        }
        await tx.bookingPnr.update({
          where: {
            id: pnr.id,
          },
          data: {
            ticketNumber: item.ticketNumber.trim(),
          },
        });
      }

      await tx.booking.update({
        where: {
          id,
        },
        data: {
          status: BookingStatus.TICKETED,
        },
      });
      await tx.bookingTimelineEvent.create({
        data: {
          bookingId: id,
          eventType: 'TICKETED',
          title: 'Đã ghi nhận xuất vé',
          payload: toJson({
            ticketNumbers: Object.fromEntries(ticketByPnr),
            notes: dto.notes ?? null,
          }),
          occurredAt: new Date(),
        },
      });
      await this.createAuditLog(tx, {
        bookingId: id,
        admin,
        request,
        action: 'booking.mark_ticketed',
        before,
        after: {
          status: BookingStatus.TICKETED,
          ticketNumbers: Object.fromEntries(ticketByPnr),
          notes: dto.notes ?? null,
        },
      });

      return tx.booking.findUniqueOrThrow({
        where: {
          id,
        },
        include: {
          pnrs: true,
          timeline: {
            orderBy: {
              occurredAt: 'desc',
            },
          },
        },
      });
    });
  }

  @Post(':id/mark-issue-failed')
  @HttpCode(200)
  async markIssueFailed(
    @Param('id') id: string,
    @Body() dto: MarkIssueFailedDto,
    @CurrentUser() admin: UserPublicDto,
    @Req() request: Request,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: {
          id,
        },
      });
      if (!booking) {
        throw new BadRequestException('Booking không tồn tại');
      }
      if (booking.status !== BookingStatus.PAID) {
        throw new ConflictException('Booking chưa thanh toán hoặc đã xử lý');
      }

      const updated = await tx.booking.update({
        where: {
          id,
        },
        data: {
          status: BookingStatus.ISSUE_FAILED,
        },
      });
      await tx.bookingTimelineEvent.create({
        data: {
          bookingId: id,
          eventType: 'ISSUE_FAILED',
          title: 'Xuất vé thủ công thất bại',
          payload: toJson({
            reason: dto.reason,
          }),
          occurredAt: new Date(),
        },
      });
      await this.createAuditLog(tx, {
        bookingId: id,
        admin,
        request,
        action: 'booking.mark_issue_failed',
        before: {
          status: booking.status,
        },
        after: {
          status: BookingStatus.ISSUE_FAILED,
          reason: dto.reason,
        },
      });

      return updated;
    });
  }

  @Get()
  async listPaidOpsQueue(
    @Query('status') status = BookingStatus.PAID,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const bookingStatus = parseBookingStatus(status);
    const pageNumber = toPositiveInt(page, 1);
    const limitNumber = Math.min(toPositiveInt(limit, 20), 50);
    const where = {
      status: bookingStatus,
    };

    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: [
          {
            muadiHoldExpiresAt: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        select: {
          id: true,
          orderCode: true,
          status: true,
          airline: true,
          fromCode: true,
          toCode: true,
          departTime: true,
          muadiHoldExpiresAt: true,
          paymentDeadline: true,
          totalSellPrice: true,
          pnrs: {
            select: {
              airline: true,
              pnr: true,
              ticketNumber: true,
            },
          },
          payments: {
            where: {
              status: PaymentStatus.PAID,
            },
            orderBy: {
              paidAt: 'desc',
            },
            take: 1,
            select: {
              paidAt: true,
            },
          },
        },
      }),
      this.prisma.booking.count({
        where,
      }),
    ]);

    return {
      items: rows.map((booking) => ({
        id: booking.id,
        orderCode: booking.orderCode,
        status: booking.status,
        pnr: booking.pnrs.map((pnr) => pnr.pnr),
        airline: booking.airline ?? booking.pnrs[0]?.airline ?? null,
        route: `${booking.fromCode}-${booking.toCode}`,
        departTime: booking.departTime,
        muadiHoldExpiresAt: booking.muadiHoldExpiresAt,
        paymentDeadline: booking.paymentDeadline,
        totalSellPrice: booking.totalSellPrice,
        paidAt: booking.payments[0]?.paidAt ?? null,
      })),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
      },
    };
  }

  private createAuditLog(
    tx: Prisma.TransactionClient,
    params: {
      bookingId: string;
      admin: UserPublicDto;
      request: Request;
      action: string;
      before: Prisma.InputJsonValue;
      after: Prisma.InputJsonValue;
    },
  ) {
    return tx.auditLog.create({
      data: {
        actorId: params.admin.id,
        actorType: 'user',
        entity: 'Booking',
        entityId: params.bookingId,
        action: params.action,
        beforeJson: params.before,
        afterJson: params.after,
        ip: params.request.ip,
        userAgent: params.request.get('user-agent') ?? null,
      },
    });
  }
}

function parseBookingStatus(status: string): BookingStatus {
  if (
    Object.values(BookingStatus).includes(status.toUpperCase() as BookingStatus)
  ) {
    return status.toUpperCase() as BookingStatus;
  }

  throw new BadRequestException('Trạng thái booking không hợp lệ');
}

function toPositiveInt(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
