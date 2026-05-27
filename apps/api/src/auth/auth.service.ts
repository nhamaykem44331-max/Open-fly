import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MembershipTier, User, UserRole } from '@prisma/client';
import { UserPublicDto } from '../common/dto/user-public.dto';
import {
  GOOGLE_AUTH_PROVIDER,
  IGoogleAuthService,
} from '../integrations/google/google-auth-provider.interface';
import { ISmsProvider, SMS_PROVIDER } from '../integrations/sms/sms-provider.interface';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { PhoneRequestDto } from './dto/phone-request.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VoiceOtpDto } from './dto/voice-otp.dto';
import { OtpService } from './otp.service';
import { RefreshTokenService } from './refresh-token.service';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: ISmsProvider,
    @Inject(GOOGLE_AUTH_PROVIDER)
    private readonly googleAuthService: IGoogleAuthService,
  ) {}

  async requestOtp(dto: PhoneRequestDto, ip?: string) {
    const { challengeId, otp } = await this.otpService.createChallenge(dto.phone, ip);
    await this.smsProvider.sendOtp(dto.phone, otp);

    return {
      challengeId,
      expiresInSeconds: 300,
    };
  }

  async requestVoiceOtp(dto: VoiceOtpDto, ip?: string) {
    const { challengeId, phone, otp } = await this.otpService.createVoiceChallenge(
      dto.challengeId,
      ip,
    );
    await this.smsProvider.sendVoiceOtp(phone, otp);

    return {
      challengeId,
      expiresInSeconds: 300,
    };
  }

  async verifyOtp(dto: OtpVerifyDto, ip?: string, userAgent?: string) {
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

    const refreshToken = await this.refreshTokenService.generate(user.id, ip, userAgent);

    return {
      accessToken: this.signAccessToken(user),
      refreshToken,
      user: UserPublicDto.fromPrisma(user),
    };
  }

  async refresh(dto: RefreshTokenDto, ip?: string, userAgent?: string) {
    const { refreshToken, user } = await this.refreshTokenService.rotate(
      dto.refreshToken,
      ip,
      userAgent,
    );

    return {
      accessToken: this.signAccessToken(user),
      refreshToken,
    };
  }

  async googleSignIn(dto: GoogleSignInDto, ip?: string, userAgent?: string) {
    const payload = await this.googleAuthService.verifyIdToken(dto.idToken);
    const now = new Date();
    const user = await this.prisma.user.upsert({
      where: {
        googleId: payload.sub,
      },
      create: {
        googleId: payload.sub,
        email: payload.email,
        googleEmail: payload.email,
        fullName: payload.name,
        avatarUrl: payload.picture,
        role: UserRole.CUSTOMER,
        tier: MembershipTier.STANDARD,
        lastLoginAt: now,
      },
      update: {
        lastLoginAt: now,
        avatarUrl: payload.picture,
        fullName: payload.name,
      },
    });

    if (!user.active || user.blocked) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    const refreshToken = await this.refreshTokenService.generate(user.id, ip, userAgent);

    return {
      accessToken: this.signAccessToken(user),
      refreshToken,
      user: UserPublicDto.fromPrisma(user),
    };
  }

  private signAccessToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
      role: user.role,
      tier: user.tier,
    });
  }

  static get accessTokenTtlSeconds() {
    return ACCESS_TOKEN_TTL_SECONDS;
  }
}
