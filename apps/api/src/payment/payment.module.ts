import { Module } from '@nestjs/common';
import { RedisModule } from '../integrations/redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentController } from './payment.controller';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SepayService } from './sepay.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [PaymentController, SepayWebhookController],
  providers: [SepayService],
  exports: [SepayService],
})
export class PaymentModule {}
