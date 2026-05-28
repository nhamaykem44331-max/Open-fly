import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminBookingController } from './admin-booking.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminBookingController],
  providers: [RolesGuard],
})
export class AdminBookingModule {}
