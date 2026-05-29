import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';
import { HuntRunProcessor } from './hunt-run.processor';
import { NotifyDispatchProcessor } from './notify-dispatch.processor';

const queueProcessors =
  process.env.RUN_WORKERS === 'false'
    ? []
    : [HuntRunProcessor, NotifyDispatchProcessor];

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: buildBullConnection(
          config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
        ),
      }),
    }),
    BullModule.registerQueue(
      {
        name: 'hunt.run',
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      },
      {
        name: 'notify.dispatch',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 200,
          removeOnFail: false,
        },
      },
    ),
  ],
  providers: queueProcessors,
  exports: [BullModule],
})
export class QueueModule {}

function buildBullConnection(redisUrl: string): RedisOptions {
  const url = new URL(redisUrl);
  const db = Number(url.pathname.replace('/', ''));

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number.isInteger(db) && db >= 0 ? db : 0,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    // BullMQ yêu cầu maxRetriesPerRequest=null; không tái dùng REDIS_CLIENT chung.
    maxRetriesPerRequest: null,
  };
}
