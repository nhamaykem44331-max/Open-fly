import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MarkupService } from './markup.service';

@Module({
  imports: [PrismaModule],
  providers: [MarkupService],
  exports: [MarkupService],
})
export class PricingModule {}
