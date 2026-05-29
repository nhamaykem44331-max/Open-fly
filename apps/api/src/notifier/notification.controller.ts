import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPublicDto } from '../common/dto/user-public.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: UserPublicDto,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('unread') unread?: string,
  ) {
    const pageNumber = toPositiveInt(page, 1);
    const limitNumber = Math.min(toPositiveInt(limit, 20), 50);
    const where = {
      userId: user.id,
      ...(unread === 'true' ? { readAt: null } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        select: {
          id: true,
          kind: true,
          title: true,
          body: true,
          ctaUrl: true,
          ctaLabel: true,
          payload: true,
          readAt: true,
          huntId: true,
          bookingId: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
    ]);

    return {
      items,
      unreadCount,
      pagination: { page: pageNumber, limit: limitNumber, total },
    };
  }

  @Post(':id/read')
  @HttpCode(200)
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: UserPublicDto,
  ) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      // Không thuộc user hoặc đã đọc; kiểm tra tồn tại để trả 404 đúng.
      const exists = await this.prisma.notification.findFirst({
        where: { id, userId: user.id },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException('Không tìm thấy thông báo');
      }
    }

    return { id, read: true };
  }

  @Post('read-all')
  @HttpCode(200)
  async markAllRead(@CurrentUser() user: UserPublicDto) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return { updated: result.count };
  }
}

function toPositiveInt(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
