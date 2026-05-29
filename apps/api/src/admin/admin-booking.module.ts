import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuditController } from './admin-audit.controller';
import { AdminBookingController } from './admin-booking.controller';
import { AdminUserController } from './admin-user.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminBookingController,
    AdminUserController,
    AdminAuditController,
  ],
  providers: [RolesGuard],
})
export class AdminBookingModule {}
