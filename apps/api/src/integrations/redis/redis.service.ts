import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureConnected();
    } catch (error) {
      this.logger.warn(`Redis connect failed: ${this.safeError(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status !== 'end') {
      try {
        await this.redis.quit();
      } catch (error) {
        this.logger.warn(`Redis disconnect failed: ${this.safeError(error)}`);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnected();
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.warn(`Redis GET failed for ${key}: ${this.safeError(error)}`);
      throw error;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.ensureConnected();
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Redis SET failed for ${key}: ${this.safeError(error)}`);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.ensureConnected();
      await this.redis.del(key);
    } catch (error) {
      this.logger.warn(`Redis DEL failed for ${key}: ${this.safeError(error)}`);
      throw error;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.redis.status === 'ready') {
      return;
    }

    if (this.redis.status === 'wait' || this.redis.status === 'end') {
      await this.redis.connect();
      return;
    }

    if (this.redis.status === 'connecting' || this.redis.status === 'connect') {
      await new Promise<void>((resolve, reject) => {
        this.redis.once('ready', resolve);
        this.redis.once('error', reject);
      });
    }
  }

  private safeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
