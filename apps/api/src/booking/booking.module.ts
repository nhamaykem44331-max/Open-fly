import { Module } from '@nestjs/common';
import { MuadiModule } from '../integrations/muadi/muadi.module';
import { PricingModule } from '../pricing/pricing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingService } from './booking.service';

@Module({
  imports: [MuadiModule, PrismaModule, PricingModule],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
