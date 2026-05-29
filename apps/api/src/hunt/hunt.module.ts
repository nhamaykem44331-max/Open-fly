import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../integrations/redis/redis.module';
import { QueueModule } from '../queue/queue.module';
import { HuntController } from './hunt.controller';
import { HuntService } from './hunt.service';

@Module({
  imports: [PrismaModule, RedisModule, QueueModule],
  controllers: [HuntController],
  providers: [HuntService],
  exports: [HuntService],
})
export class HuntModule {}
