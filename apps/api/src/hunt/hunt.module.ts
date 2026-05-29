import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../integrations/redis/redis.module';
import { NotifierModule } from '../notifier/notifier.module';
import { QueueModule } from '../queue/queue.module';
import { AutoHoldService } from './auto-hold.service';
import { HuntController } from './hunt.controller';
import { HuntService } from './hunt.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    QueueModule,
    BookingModule,
    NotifierModule,
  ],
  controllers: [HuntController],
  providers: [HuntService, AutoHoldService],
  exports: [HuntService, AutoHoldService],
})
export class HuntModule {}
