import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Hunt } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPublicDto } from '../common/dto/user-public.dto';
import { RedisService } from '../integrations/redis/redis.service';
import { CreateHuntDto } from './dto/create-hunt.dto';
import { UpdateHuntDto } from './dto/update-hunt.dto';
import { HuntService } from './hunt.service';

interface HuntCreateResponse {
  id: string;
  status: string;
  fromCode: string;
  toCode: string;
  targetPrice: number;
  intervalMinutes: number;
  nextRunAt: Date | null;
}

type HuntIdempotencyRecord =
  | { status: 'processing' }
  | { status: 'done'; response: HuntCreateResponse };

@Controller('hunts')
export class HuntController {
  constructor(
    private readonly huntService: HuntService,
    private readonly redis: RedisService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateHuntDto,
    @CurrentUser() user: UserPublicDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<HuntCreateResponse> {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Thiếu Idempotency-Key');
    }

    const cacheKey = `idempotency:hunt-create:${user.id}:${idempotencyKey.trim()}`;
    const acquired = await this.reserve(cacheKey);
    if (!acquired) {
      const cached = await this.getCached(cacheKey);
      if (cached?.status === 'done') {
        return cached.response;
      }

      throw new ConflictException('Yêu cầu đang được xử lý, vui lòng đợi giây lát');
    }

    try {
      const hunt = await this.huntService.create(
        { id: user.id, tier: user.tier },
        dto,
      );
      const response = toCreateResponse(hunt);
      await this.setCached(cacheKey, { status: 'done', response });

      return response;
    } catch (error) {
      await this.clear(cacheKey);
      throw error;
    }
  }

  @Get()
  list(@CurrentUser() user: UserPublicDto) {
    return this.huntService.list(user.id);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: UserPublicDto) {
    return this.huntService.detail(user.id, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHuntDto,
    @CurrentUser() user: UserPublicDto,
  ) {
    return this.huntService.update({ id: user.id, tier: user.tier }, id, dto);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @CurrentUser() user: UserPublicDto) {
    return this.huntService.cancel(user.id, id);
  }

  @Post(':id/run-now')
  @HttpCode(200)
  runNow(@Param('id') id: string, @CurrentUser() user: UserPublicDto) {
    return this.huntService.runNow(user.id, id);
  }

  private async reserve(key: string): Promise<boolean> {
    try {
      return await this.redis.setNx(key, { status: 'processing' }, 300);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Không đặt được trạng thái idempotency: ${safeError(error)}`,
      );
    }
  }

  private async getCached(key: string): Promise<HuntIdempotencyRecord | null> {
    try {
      return await this.redis.get<HuntIdempotencyRecord>(key);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Không đọc được trạng thái idempotency: ${safeError(error)}`,
      );
    }
  }

  private async setCached(
    key: string,
    record: HuntIdempotencyRecord,
  ): Promise<void> {
    try {
      await this.redis.set(key, record, 300);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Không ghi được trạng thái idempotency: ${safeError(error)}`,
      );
    }
  }

  private async clear(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      // best effort
    }
  }
}

function toCreateResponse(hunt: Hunt): HuntCreateResponse {
  return {
    id: hunt.id,
    status: hunt.status,
    fromCode: hunt.fromCode,
    toCode: hunt.toCode,
    targetPrice: hunt.targetPrice,
    intervalMinutes: hunt.intervalMinutes,
    nextRunAt: hunt.nextRunAt,
  };
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
