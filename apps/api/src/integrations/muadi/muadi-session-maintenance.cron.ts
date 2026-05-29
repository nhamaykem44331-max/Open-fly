import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MuadiSessionPoolService } from './muadi-session-pool.service';

/**
 * Bảo trì pool session Muadi: định kỳ tự kích hoạt lại các session đã bị
 * circuit breaker ngắt sau khi quá cooldown (half-open) để pool tự hồi phục.
 */
@Injectable()
export class MuadiSessionMaintenanceCron {
  private readonly logger = new Logger(MuadiSessionMaintenanceCron.name);

  constructor(private readonly sessionPool: MuadiSessionPoolService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reactivateStaleSessions(): Promise<void> {
    try {
      await this.sessionPool.reactivateStale();
    } catch (error) {
      this.logger.warn(
        `Muadi session maintenance cron failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
