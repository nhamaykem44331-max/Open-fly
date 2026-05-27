import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GoogleAuthModule } from '../integrations/google/google-auth.module';
import { SmsModule } from '../integrations/sms/sms.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { OtpService } from './otp.service';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    PassportModule,
    GoogleAuthModule,
    SmsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, RefreshTokenService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
