import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(@Res() response: Response) {
    const checks: { db: string } = { db: 'ok' };
    let statusCode = HttpStatus.OK;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      checks.db = `error: ${message}`;
      statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    }

    return response.status(statusCode).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
    });
  }
}
