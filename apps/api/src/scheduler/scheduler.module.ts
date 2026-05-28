import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingLifecycleCron } from './booking-lifecycle.cron';
import { BookingLifecycleService } from './booking-lifecycle.service';

@Module({
  imports: [PrismaModule],
  providers: [BookingLifecycleService, BookingLifecycleCron],
  exports: [BookingLifecycleService],
})
export class SchedulerModule {}
