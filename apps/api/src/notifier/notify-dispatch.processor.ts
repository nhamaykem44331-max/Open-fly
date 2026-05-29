import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { NOTIFY_QUEUE, NotifierService } from './notifier.service';

/**
 * Tiêu thụ job notify.dispatch -> gọi NotifierService.dispatch.
 * Nếu bị hoãn (quiet hours, thông báo không khẩn) -> xếp lại job với delay.
 */
@Processor(NOTIFY_QUEUE, {
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
})
export class NotifyDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(NotifyDispatchProcessor.name);

  constructor(
    private readonly notifier: NotifierService,
    @InjectQueue(NOTIFY_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async process(job: Job<{ notificationId?: string }>): Promise<void> {
    const notificationId = job.data?.notificationId;
    if (!notificationId) {
      return;
    }

    const { deferUntilMs } = await this.notifier.dispatch(notificationId);
    if (deferUntilMs > 0) {
      await this.queue.add(
        'dispatch',
        { notificationId },
        { delay: deferUntilMs, removeOnComplete: true },
      );
      this.logger.debug(
        `Hoãn dispatch ${notificationId} thêm ${Math.round(deferUntilMs / 60000)} phút (quiet hours)`,
      );
    }
  }
}
