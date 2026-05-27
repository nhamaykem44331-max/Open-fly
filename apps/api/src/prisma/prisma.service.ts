// Port from apg-manager/apps/api/src/common/prisma.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Prisma startup connect failed: ${message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
