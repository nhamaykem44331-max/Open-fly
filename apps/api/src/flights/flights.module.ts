import { Module } from '@nestjs/common';
import { MuadiModule } from '../integrations/muadi/muadi.module';
import { RedisModule } from '../integrations/redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';

@Module({
  imports: [MuadiModule, PrismaModule, RedisModule],
  controllers: [FlightsController],
  providers: [FlightsService],
})
export class FlightsModule {}
