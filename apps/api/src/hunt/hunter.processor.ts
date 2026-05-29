import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HunterRunService } from './hunter-run.service';
import { HUNT_RUN_QUEUE } from './hunt.service';

/** Tiêu thụ job hunt.run -> chạy một lượt quét giá cho hunt (HunterRunService). */
@Processor(HUNT_RUN_QUEUE, {
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
})
export class HunterProcessor extends WorkerHost {
  private readonly logger = new Logger(HunterProcessor.name);

  constructor(private readonly runner: HunterRunService) {
    super();
  }

  async process(job: Job<{ huntId?: string }>): Promise<void> {
    const huntId = job.data?.huntId;
    if (!huntId) {
      return;
    }
    await this.runner.run(huntId);
  }
}
