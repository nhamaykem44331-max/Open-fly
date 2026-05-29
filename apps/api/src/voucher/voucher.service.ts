import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipTier, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface VoucherActor {
  id: string;
  tier: MembershipTier;
}

@Injectable()
export class VoucherService {
  constructor(private readonly prisma: PrismaService) {}

  /** Voucher khả dụng để nhận + voucher đã sở hữu của user. */
  async list(actor: VoucherActor) {
    const now = new Date();
    const [mine, templates] = await Promise.all([
      this.prisma.userVoucher.findMany({
        where: { userId: actor.id },
        orderBy: { createdAt: 'desc' },
        include: { template: true },
      }),
      this.prisma.voucherTemplate.findMany({
        where: {
          active: true,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
        include: { _count: { select: { userVouchers: true } } },
      }),
    ]);

    const ownedTemplateIds = new Set(mine.map((v) => v.templateId));
    const available = templates.filter((tpl) => {
      if (ownedTemplateIds.has(tpl.id)) return false;
      if (tpl.tierFilter.length > 0 && !tpl.tierFilter.includes(actor.tier)) {
        return false;
      }
      if (tpl.totalQuantity != null && tpl._count.userVouchers >= tpl.totalQuantity) {
        return false;
      }
      return true;
    });

    return {
      available: available.map((tpl) => stripCount(tpl)),
      mine,
    };
  }

  /** Nhận voucher theo code. Kiểm tra active/validity/tier/quota. */
  async claim(actor: VoucherActor, code: string) {
    const tpl = await this.prisma.voucherTemplate.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!tpl || !tpl.active) {
      throw new NotFoundException('Mã ưu đãi không tồn tại');
    }

    const now = new Date();
    if (now < tpl.validFrom || now > tpl.validUntil) {
      throw new ConflictException('Mã ưu đãi đã hết hạn hoặc chưa mở');
    }
    if (tpl.tierFilter.length > 0 && !tpl.tierFilter.includes(actor.tier)) {
      throw new ForbiddenException('Hạng thành viên của bạn chưa đủ điều kiện');
    }
    if (tpl.totalQuantity != null) {
      const issued = await this.prisma.userVoucher.count({
        where: { templateId: tpl.id },
      });
      if (issued >= tpl.totalQuantity) {
        throw new ConflictException('Mã ưu đãi đã hết lượt');
      }
    }

    try {
      return await this.prisma.userVoucher.create({
        data: { userId: actor.id, templateId: tpl.id, status: 'ACTIVE' },
        include: { template: true },
      });
    } catch (error) {
      // @@unique([userId, templateId]) -> đã nhận trước đó.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Bạn đã nhận mã ưu đãi này rồi');
      }
      throw error;
    }
  }
}

function stripCount<T extends { _count?: unknown }>(tpl: T): Omit<T, '_count'> {
  const { _count, ...rest } = tpl as T & { _count?: unknown };
  void _count;
  return rest;
}
