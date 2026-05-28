import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingLifecycleService } from './booking-lifecycle.service';

@Injectable()
export class BookingLifecycleCron {
  private readonly logger = new Logger(BookingLifecycleCron.name);

  constructor(private readonly lifecycle: BookingLifecycleService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runEveryMinute(): Promise<void> {
    try {
      const expiredIntents = await this.lifecycle.expireIntents();
      const expiredBookings = await this.lifecycle.expireBookings();
      if (expiredIntents > 0 || expiredBookings > 0) {
        this.logger.log(
          `Booking lifecycle expired intents=${expiredIntents}, bookings=${expiredBookings}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Booking lifecycle cron failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
