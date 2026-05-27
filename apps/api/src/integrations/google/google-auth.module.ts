import { Module } from '@nestjs/common';
import { GOOGLE_AUTH_PROVIDER } from './google-auth-provider.interface';
import { GoogleAuthService } from './google-auth.service';
import { MockGoogleAuthService } from './mock-google-auth.service';

@Module({
  providers: [
    {
      provide: GOOGLE_AUTH_PROVIDER,
      useClass:
        process.env.NODE_ENV === 'test' ? MockGoogleAuthService : GoogleAuthService,
    },
  ],
  exports: [GOOGLE_AUTH_PROVIDER],
})
export class GoogleAuthModule {}
