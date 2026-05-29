import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { NotificationController } from './notification.controller';
import { NotifierService } from './notifier.service';
import { NotifyDispatchProcessor } from './notify-dispatch.processor';
import { TelegramService } from './telegram.service';

// Processor chỉ chạy ở process bật worker (RUN_WORKERS != 'false').
const workerProviders: Provider[] =
  process.env.RUN_WORKERS === 'false' ? [] : [NotifyDispatchProcessor];

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [NotificationController],
  providers: [NotifierService, TelegramService, ...workerProviders],
  exports: [NotifierService],
})
export class NotifierModule {}
