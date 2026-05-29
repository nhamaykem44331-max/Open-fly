// Port from apg-manager/apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminBookingModule } from './admin/admin-booking.module';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { FlightsModule } from './flights/flights.module';
import { HealthModule } from './health/health.module';
import { HuntModule } from './hunt/hunt.module';
import { MuadiModule } from './integrations/muadi/muadi.module';
import { RedisModule } from './integrations/redis/redis.module';
import { MeModule } from './me/me.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { SchedulerModule } from './scheduler/scheduler.module';

function validateEnv(config: Record<string, unknown>) {
  const requiredKeys = ['GOOGLE_CLIENT_ID'];
  for (const key of requiredKeys) {
    const value = config[key];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${key} is required`);
    }
  }

  if (config.MUADI_USE_MOCK === 'false') {
    const muadiKey = String(config.MUADI_AES_KEY ?? '');
    const muadiIv = String(config.MUADI_AES_IV ?? '');
    const appKey = String(config.APP_ENCRYPTION_KEY ?? '');
    if (Buffer.byteLength(muadiKey, 'utf8') !== 16) {
      throw new Error('MUADI_AES_KEY must be exactly 16 bytes UTF-8');
    }
    if (Buffer.byteLength(muadiIv, 'utf8') !== 16) {
      throw new Error('MUADI_AES_IV must be exactly 16 bytes UTF-8');
    }
    if (!/^[0-9a-fA-F]{64}$/.test(appKey)) {
      throw new Error('APP_ENCRYPTION_KEY must be 64 hex chars');
    }
  }

  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AdminBookingModule,
    AuthModule,
    MuadiModule,
    RedisModule,
    FlightsModule,
    BookingModule,
    PaymentModule,
    QueueModule,
    HuntModule,
    SchedulerModule,
    MeModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
