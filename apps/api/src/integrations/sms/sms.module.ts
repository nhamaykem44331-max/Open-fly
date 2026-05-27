import { Module } from '@nestjs/common';
import { MockSmsProvider } from './mock-sms.provider';
import { SMS_PROVIDER } from './sms-provider.interface';

@Module({
  providers: [
    // TODO: Replace MockSmsProvider với EsmsProvider ở task 7.
    {
      provide: SMS_PROVIDER,
      useClass: MockSmsProvider,
    },
  ],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
