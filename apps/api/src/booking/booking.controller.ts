import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  GoneException,
  Headers,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
  Body,
} from '@nestjs/common';
import { Booking, BookingStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPublicDto } from '../common/dto/user-public.dto';
import { RedisService } from '../integrations/redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingService } from './booking.service';
import { HoldBookingDto } from './dto/hold-booking.dto';

interface HoldBookingResponse {
  id: string;
  orderCode: string;
  pnr: string | null;
  status: BookingStatus;
  paymentDeadline: Date | null;
  totalSellPrice: number;
}

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Post('hold')
  async hold(
    @Body() dto: HoldBookingDto,
    @CurrentUser() user: UserPublicDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<HoldBookingResponse> {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Thiếu Idempotency-Key');
    }

    const cacheKey = `idempotency:booking-hold:${user.id}:${idempotencyKey.trim()}`;
    const cached = await this.getCachedHold(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const booking = (await this.bookingService.hold(dto, {
        userId: user.id,
        vat: dto.vat,
      })) as Booking;
      const response = toHoldResponse(booking);
      await this.setCachedHold(cacheKey, response);

      return response;
    } catch (error) {
      throw mapHoldError(error);
    }
  }

  @Get()
  async list(
    @CurrentUser() user: UserPublicDto,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNumber = toPositiveInt(page, 1);
    const limitNumber = Math.min(toPositiveInt(limit, 20), 50);
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        select: bookingListSelect,
      }),
      this.prisma.booking.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
      },
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string, @CurrentUser() user: UserPublicDto) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        passengers: true,
        pnrs: true,
        payments: true,
        paymentIntents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        timeline: {
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
    });
    if (!booking || booking.userId !== user.id) {
      throw new ForbiddenException('Không có quyền xem booking này');
    }

    return booking;
  }

  private async getCachedHold(
    key: string,
  ): Promise<HoldBookingResponse | null> {
    try {
      return await this.redis.get<HoldBookingResponse>(key);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Không đọc được cache idempotency: ${safeError(error)}`,
      );
    }
  }

  private async setCachedHold(
    key: string,
    response: HoldBookingResponse,
  ): Promise<void> {
    try {
      await this.redis.set(key, response, 300);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Không ghi được cache idempotency: ${safeError(error)}`,
      );
    }
  }
}

const bookingListSelect = {
  id: true,
  orderCode: true,
  pnr: true,
  status: true,
  airline: true,
  flightNumber: true,
  fromCode: true,
  toCode: true,
  departTime: true,
  totalSellPrice: true,
  paymentDeadline: true,
  createdAt: true,
} as const;

function toHoldResponse(booking: Booking): HoldBookingResponse {
  return {
    id: booking.id,
    orderCode: booking.orderCode,
    pnr: booking.pnr,
    status: booking.status,
    paymentDeadline: booking.paymentDeadline,
    totalSellPrice: booking.totalSellPrice,
  };
}

function mapHoldError(error: unknown): Error {
  if (
    error instanceof GoneException ||
    error instanceof BadRequestException ||
    error instanceof ConflictException ||
    error instanceof ServiceUnavailableException
  ) {
    return error;
  }
  const message = safeError(error);
  if (/price|giá|fare/i.test(message)) {
    return new ConflictException('Giá vé đã thay đổi');
  }
  if (/sold|seat|hết chỗ|không còn chỗ/i.test(message)) {
    return new ConflictException('Hết chỗ');
  }

  return error instanceof Error ? error : new Error(message);
}

function toPositiveInt(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function safeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
