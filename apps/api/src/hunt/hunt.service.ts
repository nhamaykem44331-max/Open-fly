import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Hunt, HuntStatus, MembershipTier, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../integrations/redis/redis.service';
import { CreateHuntDto } from './dto/create-hunt.dto';
import { UpdateHuntDto } from './dto/update-hunt.dto';
import { tierLimit } from './tier-limits';

export const HUNT_RUN_QUEUE = 'hunt.run';
const RUN_NOW_LOCK_SECONDS = 30;

export interface HuntActor {
  id: string;
  tier: MembershipTier;
}

@Injectable()
export class HuntService {
  private readonly logger = new Logger(HuntService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue(HUNT_RUN_QUEUE) private readonly huntQueue: Queue,
  ) {}

  async create(actor: HuntActor, dto: CreateHuntDto): Promise<Hunt> {
    const fromCode = dto.fromCode.trim().toUpperCase();
    const toCode = dto.toCode.trim().toUpperCase();
    if (fromCode === toCode) {
      throw new BadRequestException('Điểm đi và điểm đến không được trùng nhau');
    }

    const windowStart = new Date(dto.windowStart);
    const windowEnd = new Date(dto.windowEnd);
    if (windowEnd.getTime() < windowStart.getTime()) {
      throw new BadRequestException('Khoảng thời gian săn không hợp lệ');
    }

    if (dto.autoHoldEnabled) {
      this.assertAutoHoldComplete(
        dto.autoHoldPassengers,
        dto.autoHoldContactPhone,
        dto.autoHoldContactEmail,
      );
    }

    const limit = tierLimit(actor.tier);
    const activeCount = await this.prisma.hunt.count({
      where: { userId: actor.id, status: HuntStatus.HUNTING },
    });
    if (activeCount >= limit.maxActiveHunts) {
      throw new ConflictException(
        `Gói ${actor.tier} chỉ cho phép tối đa ${limit.maxActiveHunts} hunt đang chạy cùng lúc`,
      );
    }

    const intervalMinutes = Math.max(
      dto.intervalMinutes ?? limit.minIntervalMinutes,
      limit.minIntervalMinutes,
    );

    const hunt = await this.prisma.hunt.create({
      data: {
        userId: actor.id,
        status: HuntStatus.HUNTING,
        fromCode,
        toCode,
        flexibility: dto.flexibility,
        windowStart,
        windowEnd,
        targetPrice: dto.targetPrice,
        pax: dto.pax ?? 1,
        cabin: dto.cabin ?? 'economy',
        airlines: dto.airlines ?? [],
        channels: dto.channels ?? [],
        intervalMinutes,
        nextRunAt: new Date(),
        autoHoldEnabled: dto.autoHoldEnabled ?? false,
        autoHoldPassengers: dto.autoHoldEnabled
          ? toJson(dto.autoHoldPassengers)
          : Prisma.JsonNull,
        autoHoldContactPhone: dto.autoHoldEnabled
          ? dto.autoHoldContactPhone
          : null,
        autoHoldContactEmail: dto.autoHoldEnabled
          ? dto.autoHoldContactEmail
          : null,
      },
    });

    // Enqueue lần quét đầu; nếu hàng đợi lỗi -> rollback hunt để tránh mồ côi.
    try {
      await this.enqueueRun(hunt.id, 1000);
    } catch (error) {
      await this.prisma.hunt.delete({ where: { id: hunt.id } });
      throw new ServiceUnavailableException(
        `Không xếp được lịch quét: ${safeError(error)}`,
      );
    }

    await this.writeAudit(actor.id, hunt.id, 'hunt.create', null, {
      status: hunt.status,
      fromCode,
      toCode,
      targetPrice: hunt.targetPrice,
      intervalMinutes,
      autoHoldEnabled: hunt.autoHoldEnabled,
    });

    return hunt;
  }

  async list(userId: string): Promise<Hunt[]> {
    return this.prisma.hunt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async detail(userId: string, id: string) {
    const hunt = await this.prisma.hunt.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 30,
          select: {
            id: true,
            startedAt: true,
            finishedAt: true,
            cheapestPrice: true,
            cheapestDate: true,
            resultCount: true,
            diffSummary: true,
            triggeredNotif: true,
            error: true,
          },
        },
      },
    });
    if (!hunt || hunt.userId !== userId) {
      throw new NotFoundException('Không tìm thấy hunt');
    }

    return hunt;
  }

  async update(actor: HuntActor, id: string, dto: UpdateHuntDto): Promise<Hunt> {
    const hunt = await this.requireOwnedHunt(actor.id, id);

    const data: Prisma.HuntUpdateInput = {};
    let resumed = false;

    if (dto.action === 'pause') {
      if (hunt.status === HuntStatus.HUNTING) {
        data.status = HuntStatus.PAUSED;
      }
    } else if (dto.action === 'resume') {
      if (
        hunt.status === HuntStatus.PAUSED ||
        hunt.status === HuntStatus.FOUND
      ) {
        data.status = HuntStatus.HUNTING;
        data.nextRunAt = new Date();
        resumed = true;
      }
    }

    if (dto.targetPrice !== undefined) data.targetPrice = dto.targetPrice;
    if (dto.cabin !== undefined) data.cabin = dto.cabin;
    if (dto.airlines !== undefined) data.airlines = dto.airlines;
    if (dto.channels !== undefined) data.channels = dto.channels;
    if (dto.intervalMinutes !== undefined) {
      const limit = tierLimit(actor.tier);
      data.intervalMinutes = Math.max(
        dto.intervalMinutes,
        limit.minIntervalMinutes,
      );
    }

    if (dto.autoHoldEnabled === true) {
      const passengers = dto.autoHoldPassengers ?? toPassengers(hunt.autoHoldPassengers);
      const phone = dto.autoHoldContactPhone ?? hunt.autoHoldContactPhone ?? undefined;
      const email = dto.autoHoldContactEmail ?? hunt.autoHoldContactEmail ?? undefined;
      this.assertAutoHoldComplete(passengers, phone, email);
      data.autoHoldEnabled = true;
      data.autoHoldPassengers = toJson(passengers);
      data.autoHoldContactPhone = phone;
      data.autoHoldContactEmail = email;
    } else if (dto.autoHoldEnabled === false) {
      data.autoHoldEnabled = false;
    } else {
      if (dto.autoHoldPassengers !== undefined) {
        data.autoHoldPassengers = toJson(dto.autoHoldPassengers);
      }
      if (dto.autoHoldContactPhone !== undefined) {
        data.autoHoldContactPhone = dto.autoHoldContactPhone;
      }
      if (dto.autoHoldContactEmail !== undefined) {
        data.autoHoldContactEmail = dto.autoHoldContactEmail;
      }
    }

    const updated = await this.prisma.hunt.update({ where: { id }, data });

    if (resumed) {
      try {
        await this.enqueueRun(id, 1000);
      } catch (error) {
        this.logger.warn(
          `Không xếp được lịch khi resume hunt ${id}: ${safeError(error)}`,
        );
      }
    }

    await this.writeAudit(
      actor.id,
      id,
      'hunt.update',
      { status: hunt.status },
      { status: updated.status, action: dto.action ?? null },
    );

    return updated;
  }

  async cancel(userId: string, id: string): Promise<{ id: string; status: HuntStatus }> {
    const hunt = await this.requireOwnedHunt(userId, id);
    if (hunt.status === HuntStatus.CANCELLED) {
      return { id, status: HuntStatus.CANCELLED };
    }

    const updated = await this.prisma.hunt.update({
      where: { id },
      data: { status: HuntStatus.CANCELLED },
    });
    await this.writeAudit(
      userId,
      id,
      'hunt.cancel',
      { status: hunt.status },
      { status: HuntStatus.CANCELLED },
    );

    return { id, status: updated.status };
  }

  async runNow(userId: string, id: string): Promise<{ enqueued: boolean }> {
    const hunt = await this.requireOwnedHunt(userId, id);
    if (hunt.status !== HuntStatus.HUNTING) {
      throw new ConflictException('Chỉ có thể quét ngay khi hunt đang chạy');
    }

    const lockKey = `hunt:run-now:${id}`;
    let acquired = false;
    try {
      acquired = await this.redis.setNx(lockKey, { at: Date.now() }, RUN_NOW_LOCK_SECONDS);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Không kiểm tra được giới hạn quét: ${safeError(error)}`,
      );
    }
    if (!acquired) {
      throw new ConflictException('Bạn vừa quét, vui lòng đợi giây lát');
    }

    await this.enqueueRun(id, 0);
    return { enqueued: true };
  }

  private async requireOwnedHunt(userId: string, id: string): Promise<Hunt> {
    const hunt = await this.prisma.hunt.findUnique({ where: { id } });
    if (!hunt || hunt.userId !== userId) {
      throw new NotFoundException('Không tìm thấy hunt');
    }

    return hunt;
  }

  private assertAutoHoldComplete(
    passengers: { type: string }[] | undefined,
    phone: string | undefined,
    email: string | undefined,
  ): void {
    const hasAdult = (passengers ?? []).some((p) => p.type === 'ADT');
    if (!hasAdult) {
      throw new BadRequestException(
        'Bật tự giữ chỗ cần ít nhất 1 hành khách người lớn',
      );
    }
    if (!phone || !email) {
      throw new BadRequestException(
        'Bật tự giữ chỗ cần đủ số điện thoại và email liên hệ',
      );
    }
  }

  private async enqueueRun(huntId: string, delayMs: number): Promise<void> {
    await this.huntQueue.add(
      'scan',
      { huntId },
      { delay: delayMs, removeOnComplete: true },
    );
  }

  private writeAudit(
    actorId: string,
    huntId: string,
    action: string,
    before: Prisma.InputJsonValue | null,
    after: Prisma.InputJsonValue,
  ): Promise<unknown> {
    return this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorType: 'user',
          entity: 'Hunt',
          entityId: huntId,
          action,
          beforeJson: before ?? Prisma.JsonNull,
          afterJson: after,
        },
      })
      .catch((error) => {
        this.logger.warn(`Ghi AuditLog hunt thất bại: ${safeError(error)}`);
        return null;
      });
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function toPassengers(value: unknown): { type: string }[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value as { type: string }[];
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
