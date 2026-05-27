import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MembershipTier, UserRole } from '@prisma/client';
import { ISmsProvider, SMS_PROVIDER } from '../integrations/sms/sms-provider.interface';
import { PrismaService } from '../prisma/prisma.service';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { PhoneRequestDto } from './dto/phone-request.dto';
import { OtpService } from './otp.service';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: ISmsProvider,
  ) {}

  async requestOtp(dto: PhoneRequestDto, ip?: string) {
    const { challengeId, otp } = await this.otpService.createChallenge(dto.phone, ip);
    await this.smsProvider.sendOtp(dto.phone, otp);

    return {
      challengeId,
      expiresInSeconds: 300,
    };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const result = await this.otpService.verifyChallenge(dto.challengeId, dto.otp);

    const user = await this.prisma.user.upsert({
      where: {
        phone: result.phone,
      },
      create: {
        phone: result.phone,
        role: UserRole.CUSTOMER,
        tier: MembershipTier.STANDARD,
        lastLoginAt: new Date(),
      },
      update: {
        lastLoginAt: new Date(),
      },
    });

    if (!user.active || user.blocked) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      tier: user.tier,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        tier: user.tier,
      },
    };
  }

  static get accessTokenTtlSeconds() {
    return ACCESS_TOKEN_TTL_SECONDS;
  }
}
