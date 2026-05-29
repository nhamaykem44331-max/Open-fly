import { IsString, MaxLength } from 'class-validator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserPublicDto } from '../common/dto/user-public.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

class BlockUserDto {
  @IsString()
  @MaxLength(300)
  reason!: string;
}

const userSelect = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  tier: true,
  active: true,
  blocked: true,
  blockReason: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q?: string,
    @Query('blocked') blocked?: string,
  ) {
    const pageNumber = toPositiveInt(page, 1);
    const limitNumber = Math.min(toPositiveInt(limit, 20), 50);
    const where: Prisma.UserWhereInput = {};
    if (blocked === 'true') where.blocked = true;
    if (q?.trim()) {
      const term = q.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { fullName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        select: userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, pagination: { page: pageNumber, limit: limitNumber, total } };
  }

  @Post(':id/block')
  @HttpCode(200)
  async block(
    @Param('id') id: string,
    @Body() dto: BlockUserDto,
    @CurrentUser() admin: UserPublicDto,
    @Req() request: Request,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id },
        data: { blocked: true, blockReason: dto.reason },
        select: userSelect,
      });
      // Thu hồi refresh token để chặn cả phiên đang đăng nhập.
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return result;
    });

    await this.audit(admin, request, id, 'user.block', {
      blocked: user.blocked,
    }, { blocked: true, reason: dto.reason });

    return updated;
  }

  @Post(':id/unblock')
  @HttpCode(200)
  async unblock(
    @Param('id') id: string,
    @CurrentUser() admin: UserPublicDto,
    @Req() request: Request,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { blocked: false, blockReason: null },
      select: userSelect,
    });
    await this.audit(admin, request, id, 'user.unblock', {
      blocked: user.blocked,
    }, { blocked: false });

    return updated;
  }

  private audit(
    admin: UserPublicDto,
    request: Request,
    userId: string,
    action: string,
    before: Prisma.InputJsonValue,
    after: Prisma.InputJsonValue,
  ): Promise<unknown> {
    return this.prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorType: 'user',
        entity: 'User',
        entityId: userId,
        action,
        beforeJson: before,
        afterJson: after,
        ip: request.ip,
        userAgent: request.get('user-agent') ?? null,
      },
    });
  }
}

function toPositiveInt(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
