import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/audit-logs')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('entityId') entityId?: string,
  ) {
    const pageNumber = toPositiveInt(page, 1);
    const limitNumber = Math.min(toPositiveInt(limit, 50), 100);
    const where: Prisma.AuditLogWhereInput = {};
    if (entity?.trim()) where.entity = entity.trim();
    if (action?.trim()) where.action = action.trim();
    if (entityId?.trim()) where.entityId = entityId.trim();

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, pagination: { page: pageNumber, limit: limitNumber, total } };
  }
}

function toPositiveInt(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
