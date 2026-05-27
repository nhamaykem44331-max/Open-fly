import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_HASH_ROUNDS = 12;
const MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly prisma: PrismaService) {}

  generate(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  async createChallenge(phone: string, ip?: string) {
    const otp = this.generate();
    const codeHash = await bcrypt.hash(otp, OTP_HASH_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const challenge = await this.prisma.otpChallenge.create({
      data: {
        phone,
        codeHash,
        expiresAt,
        ip,
      },
    });

    return {
      challengeId: challenge.id,
      otp,
    };
  }

  async verifyChallenge(challengeId: string, otp: string) {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new UnauthorizedException('Mã OTP không đúng');
    }

    if (challenge.consumedAt) {
      throw new UnauthorizedException('Mã OTP không đúng');
    }

    if (challenge.expiresAt <= new Date()) {
      throw new UnauthorizedException('Mã OTP đã hết hạn');
    }

    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
      this.logger.warn(`max attempts exceeded for otp challenge ${challengeId}`);
      throw new UnauthorizedException('Mã OTP không đúng');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    const isValid = await bcrypt.compare(otp, challenge.codeHash);
    if (!isValid) {
      throw new UnauthorizedException('Mã OTP không đúng');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        consumedAt: new Date(),
      },
    });

    return {
      phone: challenge.phone,
    };
  }
}
