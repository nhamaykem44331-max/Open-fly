import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('notify.dispatch', {
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
})
export class NotifyDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(NotifyDispatchProcessor.name);

  async process(job: Job): Promise<void> {
    // Dispatch thật sẽ thêm ở Task T8.
    this.logger.log(`notify.dispatch nhận job id=${job.id ?? 'unknown'}`);
  }
}
