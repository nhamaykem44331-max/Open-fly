import { Module } from '@nestjs/common';
import { MuadiModule } from '../integrations/muadi/muadi.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingService } from './booking.service';

@Module({
  imports: [MuadiModule, PrismaModule],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
