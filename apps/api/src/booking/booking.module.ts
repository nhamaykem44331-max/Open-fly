import { Module } from '@nestjs/common';
import { MuadiModule } from '../integrations/muadi/muadi.module';
import { RedisModule } from '../integrations/redis/redis.module';
import { PricingModule } from '../pricing/pricing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [MuadiModule, PrismaModule, PricingModule, RedisModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
