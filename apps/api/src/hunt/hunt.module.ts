import { Module, Provider } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { FlightsModule } from '../flights/flights.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../integrations/redis/redis.module';
import { NotifierModule } from '../notifier/notifier.module';
import { QueueModule } from '../queue/queue.module';
import { AutoHoldService } from './auto-hold.service';
import { HunterProcessor } from './hunter.processor';
import { HunterRunService } from './hunter-run.service';
import { HuntController } from './hunt.controller';
import { HuntService } from './hunt.service';

// hunt.run processor chỉ chạy ở process bật worker (RUN_WORKERS != 'false').
const workerProviders: Provider[] =
  process.env.RUN_WORKERS === 'false' ? [] : [HunterProcessor];

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    QueueModule,
    BookingModule,
    NotifierModule,
    FlightsModule,
  ],
  controllers: [HuntController],
  providers: [
    HuntService,
    AutoHoldService,
    HunterRunService,
    ...workerProviders,
  ],
  exports: [HuntService, AutoHoldService],
})
export class HuntModule {}
