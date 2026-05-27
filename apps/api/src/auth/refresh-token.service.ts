import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { nanoid } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';

const REFRESH_TOKEN_HASH_ROUNDS = 12;
const REFRESH_TOKEN_SECRET_LENGTH = 64;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_INVALID_MESSAGE = 'Refresh token không hợp lệ';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    userId: string,
    ip?: string,
    userAgent?: string,
    deviceLabel?: string,
  ): Promise<string> {
    const tokenId = randomUUID();
    const rawToken = `${tokenId}.${nanoid(REFRESH_TOKEN_SECRET_LENGTH)}`;
    const tokenHash = await bcrypt.hash(rawToken, REFRESH_TOKEN_HASH_ROUNDS);

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId,
        tokenHash,
        deviceLabel,
        ip,
        userAgent,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return rawToken;
  }

  async verify(rawToken: string) {
    const tokenId = this.getTokenId(rawToken);
    if (!tokenId) {
      throw new UnauthorizedException(REFRESH_TOKEN_INVALID_MESSAGE);
    }

    const token = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
      include: { user: true },
    });

    if (!token || token.revokedAt || token.expiresAt <= new Date()) {
      throw new UnauthorizedException(REFRESH_TOKEN_INVALID_MESSAGE);
    }

    const isValid = await bcrypt.compare(rawToken, token.tokenHash);
    if (!isValid) {
      throw new UnauthorizedException(REFRESH_TOKEN_INVALID_MESSAGE);
    }

    return token;
  }

  async revoke(tokenId: string) {
    return this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  async rotate(rawToken: string, ip?: string, userAgent?: string) {
    const token = await this.verify(rawToken);
    const revoked = await this.prisma.refreshToken.updateMany({
      where: {
        id: token.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revoked.count !== 1) {
      throw new UnauthorizedException(REFRESH_TOKEN_INVALID_MESSAGE);
    }

    const refreshToken = await this.generate(
      token.userId,
      ip,
      userAgent,
      token.deviceLabel ?? undefined,
    );

    return {
      refreshToken,
      user: token.user,
    };
  }

  private getTokenId(rawToken: string) {
    const parts = rawToken.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }

    return parts[0];
  }
}
