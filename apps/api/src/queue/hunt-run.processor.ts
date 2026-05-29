import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('hunt.run', {
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
})
export class HuntRunProcessor extends WorkerHost {
  private readonly logger = new Logger(HuntRunProcessor.name);

  async process(job: Job<{ huntId?: string }>): Promise<void> {
    // Logic quét thật sẽ thêm ở Task T5.
    this.logger.log(`hunt.run nhận job huntId=${job.data?.huntId ?? 'unknown'}`);
  }
}
